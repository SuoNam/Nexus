const fs  = require('fs');
const os  = require('os');
const WebSocket = require('ws');

// 开启 WebSocket 服务，监听 8081 端口
const wss = new WebSocket.Server({ port: 8081 });
console.log('🚀 [情报搬运工] 启动成功！正在监听网卡 + 系统状态...');

// ──────────────────────────────────────────────────────────
// 1. 网速数据
// ──────────────────────────────────────────────────────────
let lastStats = {
    wired_rx: 0, wired_tx: 0,
    hotspot_rx: 0, hotspot_tx: 0
};

// ──────────────────────────────────────────────────────────
// 2. CPU 使用率（通过两次 os.cpus() 差值计算）
// ──────────────────────────────────────────────────────────
let lastCpuTotals = null;

function getCpuUsage() {
    const cpus = os.cpus();
    const cur = cpus.reduce(
        (acc, cpu) => {
            const t = cpu.times;
            const total = t.user + t.nice + t.sys + t.idle + t.irq;
            acc.total += total;
            acc.idle  += t.idle;
            return acc;
        },
        { total: 0, idle: 0 }
    );

    if (!lastCpuTotals) {
        lastCpuTotals = cur;
        return 0;
    }

    const totalDiff = cur.total - lastCpuTotals.total;
    const idleDiff  = cur.idle  - lastCpuTotals.idle;
    lastCpuTotals = cur;

    if (totalDiff === 0) return 0;
    return parseFloat(((1 - idleDiff / totalDiff) * 100).toFixed(1));
}

// ──────────────────────────────────────────────────────────
// 3. 主循环：每秒采集一次并广播
// ──────────────────────────────────────────────────────────
setInterval(() => {
    // ── 3a. 网速 ──────────────────────────────────────────
    const netData = fs.readFileSync('/proc/net/dev', 'utf8');
    const lines = netData.split('\n');
    let currentStats = { ...lastStats };

    lines.forEach(line => {
        if (line.includes('enx00e04c525f38')) {
            const parts = line.split(':')[1].trim().split(/\s+/);
            currentStats.wired_rx = parseInt(parts[0]);
            currentStats.wired_tx = parseInt(parts[8]);
        }
        if (line.includes('wlx90de80f32a0e')) {
            const parts = line.split(':')[1].trim().split(/\s+/);
            currentStats.hotspot_rx = parseInt(parts[0]);
            currentStats.hotspot_tx = parseInt(parts[8]);
        }
    });

    const calc = (curr, last) => Math.max(0, (curr - last) / (1024 * 1024));

    let speedData = { wiredUp: 0, wiredDown: 0, hotspotUp: 0, hotspotDown: 0 };
    if (lastStats.wired_rx !== 0) {
        speedData = {
            wiredUp:      calc(currentStats.wired_rx,   lastStats.wired_rx),
            wiredDown:    calc(currentStats.wired_tx,   lastStats.wired_tx),
            hotspotUp:    calc(currentStats.hotspot_rx, lastStats.hotspot_rx),
            hotspotDown:  calc(currentStats.hotspot_tx, lastStats.hotspot_tx),
        };
    }
    lastStats = currentStats;

    // ── 3b. 系统状态 ──────────────────────────────────────
    const cpuUsage = getCpuUsage();
    const [load1]  = os.loadavg();                       // 1-min load average
    const totalMem = os.totalmem();
    const freeMem  = os.freemem();
    const memUsage = parseFloat(((totalMem - freeMem) / totalMem * 100).toFixed(1));

    // ── 3c. 广播 ──────────────────────────────────────────
    const payload = JSON.stringify({
        ...speedData,
        cpuUsage,
        loadAvg: parseFloat(load1.toFixed(2)),
        memUsage,
        totalMemGB: parseFloat((totalMem / 1073741824).toFixed(1)),
        freeMemGB:  parseFloat((freeMem  / 1073741824).toFixed(1)),
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });

}, 1000);
