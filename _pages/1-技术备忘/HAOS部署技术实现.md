---
title: "HAOS部署技术实现"
date: "2026-09-02"
thumbnail: "/assets/img/cover/HAOS.png"
---

# 0. 前言
为了方面家里人看电视，我准备做一个通过语音助手就能控制红外遥控器一步一步打开B站或者卫视直播的功能。由于家里人使用的是VIVO手机和红米手机，所以要求能够接入小V和小爱同学。正好看到B站一篇专栏将一款基于ESP8266的红外遥控器接入HomeAssistant，于是决定使用HomeAssistant方案。

**硬件清单**
- 树莓派4B  约450元
- 欧瑞博智能红外遥控器CT30W  闲鱼约8元
- 红米AC2100路由器  闲鱼约45元
- 串口下载器  约5元
笔记本电脑（不带网口的话需要一个USB转RJ45）

# 1. 给树莓派安装HAOS
树莓派官方镜像写入软件Raspberry Pi Imager，

安装完成后，初始化非常慢，且容易失败怎么办？

红米AC2100刷openwrt固件走手机VPN代理。
> 问： 为什么不直接让HAOS连接wifi走代理？
> 答： 我不会，听说非常难。

# 2. 给红米AC2100路由器输入openwrt固件
> 提示： 默认固件+不刷breed也可以刷入openwrt固件
参考教程：[https://carpoolpro.cn/posts/redmi-ac2100-openwrt-guide](https://carpoolpro.cn/posts/redmi-ac2100-openwrt-guide)

## 开启SSH
记录`stok`字段
> 坑： 时间长了该字段会变断电重启也会变
复制下面的链接，把 <STOK> 替换成上面自己的值，然后访问，开启路由器 SSH。
```
http://192.168.31.1/cgi-bin/luci/;stok=<STOK>/api/misystem/set_config_iotdev?bssid=Xiaomi&user_id=longdike&ssid=-h%3B%20nvram%20set%20ssh_en%3D1%3B%20nvram%20commit%3B%20sed%20-i%20's%2Fchannel%3D.*%2Fchannel%3D%5C%22debug%5C%22%2Fg'%20%2Fetc%2Finit.d%2Fdropbear%3B%20%2Fetc%2Finit.d%2Fdropbear%20start%3B

```
> 坑： 注意自己设备ip

如果显示以下内容证明开启成功
```
{"code":0}
```
## 修改登录密码
通过漏洞注入，将你的 stok=example/​ 字符串后的内容删除，替换成以下内容
```
api/misystem/set_config_iotdev?bssid=Xiaomi&user_id=longdike&ssid=-h%3B%20echo%20-e%20'admin%5Cnadmin'%20%7C%20passwd%20root%3B
```
密码将被修改为 admin​

## 刷入固件
下载openwrt固件，注意是否对应路由器型号


使用scp（或者其他工具），将固件复制到路由器的 /tmp 目录


使用如下命令刷入固件

```bash
cd /tmp
mtd write openwrt-24.10.2-ramips-mt7621-xiaomi_mi-router-ac2100-squashfs-kernel1.bin kernel1


mtd -r write openwrt-24.10.2-ramips-mt7621-xiaomi_mi-router-ac2100-squashfs-rootfs0.bin rootfs0
```

## 开启代理
在openwrt的ssh终端，使用pkg安装redsocks
```bash
opkg update
opkg install redsocks
```
编辑配置文件 `/etc/redsocks.conf`
```bash
vi /etc/redsocks.conf
```
最小可用配置模板
```conf
base {
    log_debug = off;
    log_info = on;
    log = "syslog";
    daemon = on;
    redirector = iptables;
}

redsocks {
    local_ip = 127.0.0.1;
    local_port = 12345;

    # --------修改这里为你的上游socks5代理--------
    ip = "192.168.1.100";
    port = 1080;
    type = socks5;
    login = "";      # 有账号就填，没有留空
    password = "";
}
```
- `type` 可选：`socks5` / `socks4` / `http‑connect`
- `local_port` redsocks 本地监听端口，后面 iptables 把流量重定向到此端口。

启停服务
```bash
# 开启开机自启
/etc/init.d/redsocks enable

# 启动
/etc/init.d/redsocks start

# 查看状态
/etc/init.d/redsocks status

# 看日志排查问题
logread | grep redsocks

```

##  iptables 透明代理规则（LAN 内网全部 TCP 走 redsocks）

> 
> ⚠️OpenWrt 新版本如果是 nftables 固件，iptables 命令会失效。

```
# 创建redsocks链
iptables -t nat -N REDSOCKS

# 排除代理服务器本身IP，防止循环
iptables -t nat -A REDSOCKS -d 192.168.1.100 -j RETURN

# 排除内网网段不走代理
iptables -t nat -A REDSOCKS -d 0.0.0.0/8 -j RETURN
iptables -t nat -A REDSOCKS -d 10.0.0.0/8 -j RETURN
iptables -t nat -A REDSOCKS -d 127.0.0.0/8 -j RETURN
iptables -t nat -A REDSOCKS -d 169.254.0.0/16 -j RETURN
iptables -t nat -A REDSOCKS -d 172.16.0.0/12 -j RETURN
iptables -t nat -A REDSOCKS -d 192.168.0.0/16 -j RETURN
iptables -t nat -A REDSOCKS -d 224.0.0.0/4 -j RETURN
iptables -t nat -A REDSOCKS -d 240.0.0.0/4 -j RETURN

# 将其余tcp流量重定向到redsocks本地端口12345
iptables -t nat -A REDSOCKS -p tcp -j REDIRECT --to‑ports 12345

# LAN进来的流量应用这条规则
iptables -t nat -A PREROUTING -i br‑lan -p tcp -j REDSOCKS
```

> 
> 上面命令 ssh 敲完**临时生效；重启路由器就丢失**。想要永久生效，要写到 `/etc/firewall.user`，防火墙启动时自动加载。

```
nano /etc/firewall.user
```

把上面全部 iptables 规则粘贴到此文件末尾，保存。执行：

```
/etc/init.d/firewall reload
```

## 关闭代理（清除 iptables 规则）

```
iptables -t nat -D PREROUTING -i br‑lan -p tcp -j REDSOCKS
iptables -t nat -F REDSOCKS
iptables -t nat -X REDSOCKS
/etc/init.d/redsocks stop
```

## 常见坑

1. **redsocks 只处理 TCP，UDP DNS 不会被代理，会 DNS 泄露**，需要额外配置 DNS 转发。
2. OpenWrt23 + 很多固件是 nftables，iptables 命令无效，redsocks 原生 iptables redirector 不支持 nft，需要改用 redsocks2 或者用 nft 手动写规则。
3. 上游代理地址写错误、网络不通，`logread | grep redsocks` 会打印连接失败日志。
4. 官方 opkg 的 redsocks**没有 luci 网页界面**，全部靠 ssh 配置；想要网页界面需要第三方 luci‑app‑redsocks 包，官方源没有。

> 接下来不出意外的话，树莓派插网线到路由器lan口就能走代理了
> 当然前提是你手机开了vpn局域网共享，且openwrt配置了手机热点的wifi中继

> 现在就可以愉快的等待HAOS更新了

# 3. 安装ESPHome，给CT30W刷固件
在`设置` -> `应用` 中安装 `ESPHome`，重启服务后，创建设备，使用如下配置文件
> 注意一定要有`api` 否则场景识别不到设备
> 另外下面的红外码是海信电视的红外码，想要其他遥控的可以在刷固件成功后，向CT30W发射红外，日志中就会出现红外码，然后修改配置文件进行OTA就好了。
```yaml
# Board: ESP-WROOM-02
# Definition: definitions/boards/esp_wroom_02/manifest.yaml

esphome:
  name: ct30w
  friendly_name: 红外遥控器

esp8266:
  board: esp_wroom_02

web_server:
  port: 80

logger:
  level: DEBUG

api:
  

# Orvibo pin :
# GPIO14:  IR transmitter
# GPIO5:   IR receiver
# GPIO15:  LED
# GPIO4:   Key

remote_receiver:
  pin: 
    number: GPIO5
    inverted: true
  idle: 500ms
  dump: raw

remote_transmitter:
  pin: GPIO14
  carrier_duty_percent: 50%

switch:
  - platform: template
    name: "TV"
    optimistic: true
    turn_on_action: 
      - remote_transmitter.transmit_raw: 
          carrier_frequency: 38kHz
          code: [9019, -4450, 601, -532, 599, -532, 599, -532, 600, -531, 599, -534, 598, -532, 599, -531, 601, -531, 600, -1663, 599, -1662, 601, -1663, 599, -1664, 598, -1665, 598, -1664, 598, -532, 600, -1664, 598, -1664, 598, -534, 598, -1664, 599,]
    turn_off_action: 
      - remote_transmitter.transmit_raw: 
          carrier_frequency: 38kHz
          code: [9019, -4450, 601, -532, 599, -532, 599, -532, 600, -531, 599, -534, 598, -532, 599, -531, 601, -531, 600, -1663, 599, -1662, 601, -1663, 599, -1664, 598, -1665, 598, -1664, 598, -532, 600, -1664, 598, -1664, 598, -534, 598, -1664, 599,]

button:
  - platform: template
    name: "TV_up"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9018, -4452, 599, -531, 599, -534, 598, -531, 600, -532, 599, -531, 601, -530, 601, -532, 599, -531, 601, -1663, 600, -1663, 598, -1664, 599, -1662, 600, -1663, 599, -1664, 599, -532, 599, -1664, 599, -531, 600, -1665, 598, -1663, 599, ]
  - platform: template
    name: "TV_down"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9014, -4455, 598, -534, 572, -559, 597, -537, 594, -533, 598, -537, 596, -534, 596, -534, 598, -533, 598, -1666, 571, -1690, 571, -1693, 572, -1690, 594, -1667, 598, -1666, 595, -539, 592, -1667, 595, -1668, 594, -1669, 596, -1666, 595, ]
  - platform: template
    name: "TV_left"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9017, -4453, 597, -535, 596, -535, 598, -532, 598, -533, 599, -534, 598, -531, 598, -534, 599, -533, 598, -1663, 599, -1664, 599, -1664, 598, -1663, 600, -1662, 600, -1665, 598, -532, 600, -1663, 597, -1667, 596, -534, 595, -536, 600, ]
  - platform: template
    name: "TV_right"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9019, -4454, 597, -530, 601, -530, 601, -532, 600, -530, 601, -531, 601, -530, 601, -530, 600, -532, 600, -1662, 600, -1664, 599, -1664, 599, -1662, 600, -1664, 598, -1662, 602, -531, 600, -1663, 599, -530, 601, -530, 600, -533, 600, ]
  - platform: template
    name: "TV_vol_up"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9017, -4454, 598, -532, 598, -535, 596, -535, 597, -534, 597, -534, 600, -533, 594, -537, 598, -532, 599, -1663, 598, -1664, 599, -1664, 597, -1666, 595, -1666, 597, -1666, 598, -534, 595, -1666, 599, -533, 598, -533, 598, -1667, 595,]
  - platform: template
    name: "TV_vol_down"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9014, -4456, 597, -534, 597, -534, 596, -535, 598, -533, 597, -536, 594, -536, 595, -537, 595, -537, 596, -1664, 597, -1667, 597, -1664, 596, -1669, 593, -1668, 595, -1667, 594, -538, 596, -1666, 594, -1667, 599, -1665, 597, -534, 595, ]
  - platform: template
    name: "TV_signal"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [8989, -4479, 573, -557, 604, -555, 597, -561, 574, -555, 575, -558, 599, -558, 573, -559, 572, -561, 572, -1689, 599, -1691, 596, -1691, 600, -1690, 571, -1690, 598, -1691, 598, -559, 575, -1689, 600, -555, 599, -1693, 571, -559, 601, ]
  - platform: template
    name: "TV_back"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9045, -4478, 600, -531, 600, -558, 573, -531, 601, -529, 602, -531, 573, -531, 600, -532, 600, -556, 575, -1663, 601, -1660, 600, -1663, 573, -1663, 602, -1662, 600, -1661, 576, -530, 597, -1665, 573, -531, 600, -531, 603, -529, 575, ]
  - platform: template
    name: "TV_menu"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [9019, -4452, 603, -528, 602, -528, 602, -530, 600, -531, 598, -533, 603, -529, 573, -558, 626, -505, 599, -1663, 600, -1662, 630, -1634, 597, -1665, 603, -1661, 598, -1661, 603, -531, 627, -1634, 600, -531, 600, -531, 600, -1664, 599,]

  - platform: template
    name: "TV_home"
    on_press:
      then:
        - remote_transmitter.transmit_raw: 
            carrier_frequency: 38kHz
            code: [8938, -4426, 599, -505, 599, -506, 601, -504, 600, -505, 601, -502, 600, -508, 627, -478, 597, -506, 601, -1636, 598, -1639, 597, -1638, 600, -1636, 602, -1634, 599, -1639, 599, -505, 601, -1636, 599, -505, 599, -506, 599, -1636, 600, ]

light:
  - platform: status_led
    name: "state_led"
    pin: 
      number: GPIO15
      inverted: false
          
ota:
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

```


# 4. 安装HACS或HACS极速版（中国访问快）
期间可能遇到无法访问`**[raw.githubusercontent.com](https://raw.githubusercontent.com)**`,这是域名污染的原因，登录路由器ssh，在`rc.local`中添加该网址ip就好

再安装一个`SSH`插件，用于访问树莓派HAOS的命令行。

使用SSH之前需要先设置密码。

HACS安装好以后，在HACS中安装vivohomebridge，这个插件，可以使用git克隆仓库到`/config/custom_components`,这个路径，注意只需要脚本部分。

克隆不下来可以使用国内镜像。

vivo智慧生活只能看到每个设备的开关和传感器，因此无法看见脚本和自动化流程。

因此我的自动化触发开关是CT30W的light开关。