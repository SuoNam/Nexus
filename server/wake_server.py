import serial
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import platform
import psutil
import httpx
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI(
    title="RK3528 Box API",
    description="盒子状态监控接口",
    version="1.0.0"
)

# 1. 配置跨域 (CORS)
# 允许你的 Vue 前端（可能是大电脑或大屏）跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议改为具体的阿里云域名或本地IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 基础路由：保活与基本信息

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Welcome to RK3528 Box API Server",
        "device": platform.node()
    }

# 3. 功能路由：暴露给数字大屏的状态接口
@app.get("/status")
async def get_box_status():
    try:
        # 获取盒子 CPU 使用率和内存状态
        status = {
            "cpu_usage": f"{psutil.cpu_percent()}%",
            "memory": f"{psutil.virtual_memory().percent}%",
            "arch": platform.machine(),
            "os": platform.system()
        }
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/weather")
async def get_weather(request: Request, ip: Optional[str] = None):
    """
    获取客户端所在地的 7 天天气数据（昨天 + 今天 + 未来5天）
    使用和风天气 API (专属节点 + Header 鉴权版)
    
    优先使用传入的 ip 参数，否则从请求头 X-Forwarded-For / X-Real-IP 获取客户端真实 IP。
    这样在 BT 面板 nginx 反代环境下也能正确获取用户 IP。
    """
    # ==========================================
    # URL 定义部分：全部统一使用专属 Host！
    # ==========================================
    QWEATHER_API_KEY = "02aedfbd47a7459384722a79c55b2457"
    QWEATHER_HOST = "https://jw6r722k8d.re.qweatherapi.com"
    
    QWEATHER_FORECAST_URL = f"{QWEATHER_HOST}/v7/weather/7d"
    QWEATHER_FALLBACK_URL = f"{QWEATHER_HOST}/v7/weather/3d"
    QWEATHER_HISTORICAL_URL = f"{QWEATHER_HOST}/v7/historical/weather"
    # 🔴 核心修复：定位城市也要用你的专属域名！
    QWEATHER_GEO_URL = f"{QWEATHER_HOST}/geo/v2/city/lookup"

    req_headers = {
        "X-QW-Api-Key": QWEATHER_API_KEY
    }

    # ---- 获取客户端真实 IP ----
    if not ip:
        # 优先取 X-Forwarded-For（nginx 反代会设置此头）
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            # 其次取 X-Real-IP
            ip = request.headers.get("X-Real-IP")
        if not ip:
            # 最后 fallback 到直接连接的 remote_addr
            ip = request.client.host if request.client else "127.0.0.1"
    print(f"🌤️ 天气查询 - 客户端IP: {ip}")

    try:
        # ==========================================
        # Step 1: IP -> 城市名 -> Location ID
        # ==========================================
        location_id = "101070201"  # 默认城市兜底：大连
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                
                # 🔴 核心修复：换用原生 UTF-8 的国际 IP 接口，绝不乱码
                city_name = "大连"
                try:
                    # lang=zh-CN 保证返回中文城市名
                    ip_resp = await client.get(f"http://ip-api.com/json/{ip}?lang=zh-CN")
                    ip_data = ip_resp.json()
                    
                    if ip_data.get("status") == "success" and ip_data.get("city"):
                        # 拿到例如 "大连市"，去掉 "市" 字
                        city_name = ip_data["city"].replace("市", "")
                except Exception as e:
                    print(f"⚠️ IP转换城市名失败，使用默认城市。错误: {e}")

                # 用文字城市名请求你的专属 Geo 节点
                geo_resp = await client.get(
                    QWEATHER_GEO_URL, 
                    headers=req_headers,
                    params={"location": city_name}
                )
                
                geo_data = geo_resp.json() if geo_resp.text else {}
                
                if str(geo_data.get("code")) == "200" and geo_data.get("location"):
                    location_id = geo_data["location"][0]["id"]
                else:
                    print(f"⚠️ 和风天气无法解析城市 '{city_name}'，启用兜底。响应: {geo_data}")
                    
        except httpx.RequestError as e:
            print(f"🚨 呼叫位置 API 失败 (网络断开或超时): {e}")


        # ==========================================
        # Step 2: 获取未来预报数据 (7天优先，3天兜底)
        # ==========================================
        forecast_days = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                forecast_resp = await client.get(
                    QWEATHER_FORECAST_URL, 
                    headers=req_headers,
                    params={"location": location_id}
                )
                forecast_data = forecast_resp.json()
                
                if str(forecast_data.get("code")) == "200":
                    forecast_days = forecast_data.get("daily", [])
                else:
                    print(f"👉 7天预报失败，返回: {forecast_data}。尝试降级获取3天预报...")
                    # fallback 到 3d 接口
                    fallback_resp = await client.get(
                        QWEATHER_FALLBACK_URL,
                        headers=req_headers,
                        params={"location": location_id}
                    )
                    fallback_data = fallback_resp.json()
                    if str(fallback_data.get("code")) == "200":
                        forecast_days = fallback_data.get("daily", [])
                    else:
                        print(f"👉 3天预报也失败，返回: {fallback_data}")
        except httpx.RequestError as e:
            print(f"🚨 获取预报数据网络超时: {e}")


        # ==========================================
        # Step 3: 获取昨天历史数据 (静默容错)
        # ==========================================
        yesterday_data = None
        try:
            yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
            async with httpx.AsyncClient(timeout=5.0) as client:
                hist_resp = await client.get(
                    QWEATHER_HISTORICAL_URL, 
                    headers=req_headers,
                    params={"location": location_id, "date": yesterday_str}
                )
                
                if "application/json" in hist_resp.headers.get("Content-Type", ""):
                    hist_data = hist_resp.json()
                    if str(hist_data.get("code")) == "200" and hist_data.get("daily"):
                        yesterday_data = hist_data["daily"][0]
                else:
                    print(f"⚠️ 历史天气请求异常，状态码: {hist_resp.status_code}")
        except Exception as e:
            print(f"⚠️ 获取历史天气失败，跳过该数据。错误原因: {e}")


        # ==========================================
        # Step 4: 整合并清洗数据给前端
        # ==========================================
        weather_list = []
        
        # 提取核心字段的内部函数，保持代码整洁
        def extract_weather_info(day_data):
            return {
                "date": day_data.get("fxDate", ""),
                "text": day_data.get("textDay", ""),
                "tempMax": day_data.get("tempMax", ""),
                "tempMin": day_data.get("tempMin", ""),
                "windDir": day_data.get("windDirDay", ""),
                "windScale": day_data.get("windScaleDay", ""),
                "iconDay":day_data.get("iconDay","")
            }

        # 先塞入昨天的数据
        if yesterday_data:
            weather_list.append(extract_weather_info(yesterday_data))
            
        # 再塞入未来的数据
        for day in forecast_days:
            weather_list.append(extract_weather_info(day))

        # 即使 weather_list 是空的，前端拿到 code 200 也不会崩溃，只会不显示数据
        return {"code": 200, "data": weather_list}

    except HTTPException:
        raise
    except Exception as e:
        print("🚨 发生未捕获异常:")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/wake_up")
async def wake_up():
    s=serial.Serial('/dev/ttyUSB0',9600)
    s.write(b'W')
    return {"status":200, "message": "唤醒成功"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)