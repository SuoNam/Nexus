import axios from 'axios'

export let app = axios.create({
    baseURL: "http://123.57.28.236:8100"
}
);

export async function wake_up(): Promise<boolean> {
    try {
        const response = await app.get("/wake_up");
        return response.data.status === 200;
    } catch (e) {
        return false;
    }
}

export async function getWeather(ip?: string): Promise<any> {
    try {
        const params: Record<string, string> = {};
        if (ip) {
            params.ip = ip;
        }
        const response = await app.get("/api/weather", { params });
        return response.data;
    } catch (e) {
        return { code: 500, data: [] };
    }
}
