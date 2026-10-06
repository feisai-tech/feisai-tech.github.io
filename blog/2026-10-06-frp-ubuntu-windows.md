---
title: frp 内网穿透教程：Ubuntu 服务器 + Windows 11
description: 通过一台有公网 IP 的 Ubuntu 服务器，让没有公网 IP 的 Windows 电脑可以被外部访问。
authors: [zhengsaihong]
tags: [frp, Ubuntu, Windows]
---

这份教程用于让没有公网 IP 的 Windows 电脑，通过一台有公网 IP 的 Ubuntu 服务器被外部访问。

本教程先实现最容易验证的 **SSH 内网穿透**，成功后可以继续映射远程桌面、网站或其他 TCP 服务。

{/* truncate */}

## 一、工作原理

```text
外部电脑
   │ SSH 访问服务器:6000
   ▼
公网服务器 frps:6000
   ▲
   │ frpc 主动连接服务器:28080
   │
Windows 11 frpc → 本机 127.0.0.1:22
```

家里网络不需要公网 IP，也不需要在家用路由器上做端口转发。只有服务器需要公网 IP。

## 二、本教程使用的参数

| 项目 | 值 |
|---|---|
| 公网服务器系统 | Ubuntu 22.04 LTS |
| 公网服务器架构 | x86_64 |
| 本地电脑 | Windows 11 64 位 |
| frp 版本示例 | v0.71.0 |
| 服务器公网 IP | `216.167.70.247` |
| frps 连接端口 | `28080` |
| 外部 SSH 端口 | `6000` |
| Windows 本地 SSH 端口 | `22` |

如果你的 IP、版本或本地服务端口不同，把配置中的对应值替换掉即可。

## 三、安装前检查

### 服务器检查系统和架构

在服务器执行：

```bash
cat /etc/os-release
uname -m
```

本教程要求类似：

```text
Ubuntu 22.04
x86_64
```

架构对应关系：

```text
x86_64       → linux_amd64
 aarch64     → linux_arm64
```

### 查询官方最新版本

frp 版本应以官方 Releases 为准：

[官方 frp Releases](https://github.com/fatedier/frp/releases)

也可以在 Linux 服务器查询：

```bash
curl -fsSL https://api.github.com/repos/fatedier/frp/releases/latest \
| python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"])'
```

本文命令使用 `v0.71.0` 作为示例。换版本时，需要同时替换下载文件名和解压目录名。

## 四、服务器安装 frps

### 1. 下载并安装

在 Ubuntu 服务器执行：

```bash
cd /tmp

apt-get update
apt-get install -y wget ca-certificates openssl

wget https://github.com/fatedier/frp/releases/download/v0.71.0/frp_0.71.0_linux_amd64.tar.gz

tar -xzf frp_0.71.0_linux_amd64.tar.gz

mkdir -p /etc/frp

install -m 755 \
frp_0.71.0_linux_amd64/frps \
/usr/local/bin/frps
```

### 2. 生成认证 token

执行：

```bash
openssl rand -hex 32
```

复制输出的随机字符串。它是 frps 和 frpc 之间的共享密码，后面两边必须完全一致。

不要把真实 token 写入公开文档、截图或聊天记录。

### 3. 创建 frps 配置

```bash
nano /etc/frp/frps.toml
```

写入：

```toml
bindPort = 28080

auth.method = "token"
auth.token = "这里替换为刚才生成的 token"
```

保存并退出 nano：

```text
Ctrl+O → 回车 → Ctrl+X
```

### 4. 创建 systemd 服务

```bash
nano /etc/systemd/system/frps.service
```

写入：

```ini
[Unit]
Description=frps
After=network.target

[Service]
ExecStart=/usr/local/bin/frps -c /etc/frp/frps.toml
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启动并设置开机启动：

```bash
systemctl daemon-reload
systemctl enable --now frps
systemctl status frps --no-pager
```

正常结果应包含：

```text
Active: active (running)
```

检查 28080 是否监听：

```bash
ss -lntp | grep 28080
```

### 5. 放行服务器端口

如果服务器使用 UFW：

```bash
ufw allow 28080/tcp
ufw allow 6000/tcp
```

同时在云服务器控制台的安全组中放行：

```text
TCP 28080
TCP 6000
```

`28080` 用于 Windows 的 frpc 连接服务器，`6000` 用于外部访问 Windows SSH。

## 五、Windows 11 安装并检查 OpenSSH Server

本节只用于先验证 SSH 穿透。如果你要映射网站或其他服务，可以跳过 OpenSSH，直接把 frpc 的 `localPort` 改成目标服务端口。

### 1. 检查 Windows 版本和架构

用管理员 PowerShell 执行：

```powershell
Get-CimInstance Win32_OperatingSystem |
Select-Object Caption, Version, OSArchitecture
```

本教程使用 Windows 11 64 位，对应 `windows_amd64`。

### 2. 检查 OpenSSH 是否安装

```powershell
Get-WindowsCapability -Online |
Where-Object Name -like 'OpenSSH.Server*' |
Select-Object Name, State
```

如果状态是 `NotPresent`，用管理员 PowerShell 安装：

```powershell
DISM /Online /Add-Capability /CapabilityName:OpenSSH.Server~~~~0.0.1.0
```

DISM 可能长时间停在某个百分比，这是 Windows 组件安装过程。等待它完成并显示：

```text
操作成功完成。
```

再次检查，应该显示：

```text
OpenSSH.Server~~~~0.0.1.0    Installed
```

### 3. 启动 SSH 服务

```powershell
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
Get-Service sshd
```

测试本机 22 端口：

```powershell
Test-NetConnection 127.0.0.1 -Port 22
```

应该看到：

```text
Status : Running
TcpTestSucceeded : True
```

### 4. 确认 Windows 登录密码

SSH 密码必须是 Windows 账户密码，不能使用 Windows Hello PIN，也不能使用 frp token。

查看当前用户名：

```powershell
whoami
```

例如：

```text
desktop-ei2tsi8\shunlu
```

SSH 用户名使用最后的 `shunlu`。

如果账户没有密码，可以设置一个：

```powershell
net user shunlu *
```

输入新密码两次时屏幕不会显示字符，这是正常现象。

## 六、Windows 安装 frpc

### 1. 下载客户端

在 PowerShell 执行：

```powershell
New-Item -ItemType Directory -Force C:\frp | Out-Null

Invoke-WebRequest `
  -Uri https://github.com/fatedier/frp/releases/download/v0.71.0/frp_0.71.0_windows_amd64.zip `
  -OutFile C:\frp.zip

Expand-Archive `
  -Path C:\frp.zip `
  -DestinationPath C:\frp-temp `
  -Force

Copy-Item `
  C:\frp-temp\frp_0.71.0_windows_amd64\frpc.exe `
  C:\frp\frpc.exe
```

### 2. 创建 frpc 配置

```powershell
notepad C:\frp\frpc.toml
```

写入：

```toml
serverAddr = "216.167.70.247"
serverPort = 28080

auth.method = "token"
auth.token = "这里填写与服务器相同的 token"

[[proxies]]
name = "windows-ssh"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = 6000
```

注意：

- `serverAddr` 填服务器公网 IP。
- `serverPort` 必须和服务器的 `bindPort` 一致，都是 `28080`。
- 两边的 `auth.token` 必须完全一致。
- `localPort = 22` 表示映射 Windows SSH。
- `remotePort = 6000` 表示外部通过服务器 6000 端口访问。

### 3. 前台启动测试

```powershell
cd C:\frp
.\frpc.exe -c .\frpc.toml
```

看到下面两类日志，就表示连接成功：

```text
login to server success
start proxy success
```

## 七、测试内网穿透

最好用另一台电脑，或手机切换到移动网络后执行：

```bash
ssh -p 6000 shunlu@216.167.70.247
```

第一次连接会询问是否信任服务器指纹，输入：

```text
yes
```

然后输入 Windows 账户密码。

登录成功后会看到类似：

```text
shunlu@DESKTOP-EI2TSI8 C:\Users\ShunLu>
```

这表示已经通过公网服务器进入内网 Windows。

退出 SSH：

```bash
exit
```

## 八、让 Windows frpc 后台运行

前台运行时，关闭 PowerShell 就会断开。使用 Windows 自带的任务计划程序让它开机自动运行。

### 1. 停止前台 frpc

回到运行 frpc 的窗口，按：

```text
Ctrl+C
```

### 2. 创建开机任务

用管理员 PowerShell 执行：

```powershell
schtasks.exe /Create /TN frpc /SC ONSTART /RU SYSTEM /TR "C:\frp\frpc.exe -c C:\frp\frpc.toml" /F
```

立即启动任务：

```powershell
schtasks.exe /Run /TN frpc
```

查询任务：

```powershell
schtasks.exe /Query /TN frpc /V /FO LIST
```

看到以下内容表示正常：

```text
计划任务状态：已启用
计划类型：系统启动时
作为用户运行：SYSTEM
模式：正在运行
```

任务运行后，可以关闭 PowerShell。Windows 重启后会自动启动 frpc。

停止任务：

```powershell
schtasks.exe /End /TN frpc
```

删除任务：

```powershell
schtasks.exe /Delete /TN frpc /F
```

## 九、映射其他内网服务

### 映射 Windows 远程桌面

确认 Windows 已启用远程桌面后，在 `frpc.toml` 增加：

```toml
[[proxies]]
name = "windows-rdp"
type = "tcp"
localIP = "127.0.0.1"
localPort = 3389
remotePort = 23389
```

然后在服务器的 UFW（如果启用）和云安全组中都放行 TCP `23389`：

```bash
ufw allow 23389/tcp
```

通过：

```text
服务器公网 IP:23389
```

连接远程桌面。不要直接把 3389 暴露到公网，使用强密码并限制访问来源。

### 映射本地网站

假设 Windows 上的网站监听 `127.0.0.1:8080`：

```toml
[[proxies]]
name = "windows-web"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8080
remotePort = 28081
```

在服务器的 UFW（如果启用）和云安全组中放行 TCP `28081`：

```bash
ufw allow 28081/tcp
```

然后访问：

```text
http://216.167.70.247:28081
```

每增加一个 `remotePort`，都要在服务器防火墙和云安全组中放行对应端口。

修改 `C:\frp\frpc.toml` 后，需要重启后台任务让新配置生效：

```powershell
schtasks.exe /End /TN frpc
schtasks.exe /Run /TN frpc
```

## 十、常见问题

### 1. frpc 登录服务器失败

检查：

- 服务器安全组是否放行 TCP 28080。
- Ubuntu 防火墙是否放行 28080。
- `serverAddr` 是否为服务器公网 IP。
- `serverPort` 是否为 28080。
- 两边 token 是否完全一致。
- frps 和 frpc 版本是否一致。

服务器查看日志：

```bash
journalctl -u frps -n 50 --no-pager
```

### 2. proxy start failed

常见原因：

- `localPort` 对应的本地服务没有启动。
- `remotePort` 已经被服务器上的其他程序占用。
- 云安全组或 UFW 没有放行对应端口。
- 同一个 frpc 被启动了两次。

### 3. SSH 显示 Permission denied

确认：

- 用户名使用 `shunlu`，不要写 `DESKTOP-EI2TSI8\shunlu`。
- 输入的是 Windows 账户密码，不是 PIN。
- Windows 账户不能是空密码。
- `sshd` 服务状态为 `Running`。

### 4. DISM 安装 OpenSSH 很慢

`Add-WindowsCapability` 可能需要通过 Windows Update 下载组件。如果长时间不动，可以使用：

```powershell
DISM /Online /Add-Capability /CapabilityName:OpenSSH.Server~~~~0.0.1.0
```

检查网络：

```powershell
Test-NetConnection download.windowsupdate.com -Port 443
```

看到：

```text
TcpTestSucceeded : True
```

说明网络可以访问 Windows Update。

### 5. 查看后台任务是否运行

```powershell
schtasks.exe /Query /TN frpc /V /FO LIST
```

`上次结果: 267009` 或十六进制 `0x41301` 表示任务当前正在运行。

## 十一、修改或轮换 token

在服务器生成新 token：

```bash
openssl rand -hex 32
```

同时修改：

```text
服务器：/etc/frp/frps.toml
Windows：C:\frp\frpc.toml
```

服务器重启：

```bash
systemctl restart frps
```

Windows 重启后台任务：

```powershell
schtasks.exe /End /TN frpc
schtasks.exe /Run /TN frpc
```

## 十二、完成检查清单

- [ ] 服务器 `frps` 状态为 `active (running)`。
- [ ] 服务器监听 TCP 28080。
- [ ] 云安全组放行 TCP 28080 和需要使用的映射端口。
- [ ] Windows `sshd` 状态为 `Running`。
- [ ] Windows 本地 22 端口测试成功。
- [ ] frpc 日志显示 `login to server success`。
- [ ] frpc 日志显示 `start proxy success`。
- [ ] 外部 SSH 可以连接 `服务器IP:6000`。
- [ ] Windows 任务计划程序显示 frpc 正在运行。
- [ ] 真实 token 没有写入公开文档或截图。
