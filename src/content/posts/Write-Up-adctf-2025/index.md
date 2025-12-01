---
title: The Write Up of ADCTF 2025
published: 2025-11-28T04:40:26.381Z
tags: [WriteUp]
category: WriteUp
draft: false
---
# 前言
这是我的第一篇WriteUp,可能有很多纰漏,欢迎纠正
![](HOME.png)
# AI
## [Easy]RKK问答
:::note[描述]
与 RKK 对话，探索 TA 的世界。
:::
### 解题思路:
#### 错误示范(弯路):
不断尝试prompt注入\
包括但不限于:伪装身份,覆盖认知等\
此处给出我们出题人[teru](https://keqing.moe)在赛后给出的防注入提示词
![](RKK-AI.png)
#### 正确示范:
根据对[RKK](https://blog.rkk.moe/)的了解,不难猜出其数字孪生的喜好\
我们只需不断发送```[图片]```即可让RKK-AI乖乖吐出FLAG
![HDR有BUG截屏是这样](RKK-AI2.png)
# crypto
## [Easy]这家伙在说什么呢？
:::note[描述]
0在王者峡谷里看见了盾山，它不知道在叽里咕噜地说什么呢？然后一个背摔把 0 丢去出题了。
:::
### 解题思路:
要解决这串二进制转Flag的问题，核心思路是**5位二进制分组转Base32编码**（Base32的标准规则是将二进制按每5位一组，映射到`A-Z`（0-25）和`2-7`（26-31）的字符集）。
#### 步骤1：分组与十进制转换
题目中的二进制已按**5位一组**分隔，先将每组转为十进制：
```
分组：00101 01011 00000 00110 00011 10100 01101 10010 00111 00000 01101 10010 00111 10100 01110 00011 00100 00011 10100 01000
十进制：5   11   0    6    3    20   13   18   7    0    13   18   7    20   14   3    4    3    20   8
```
#### 步骤2：Base32映射
Base32的字符集为`ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`（索引0-25对应`A-Z`，26-31对应`2-7`）。将十进制索引映射到字符：
```
十进制：5→F 11→L 0→A 6→G 3→D 20→U 13→N 18→S 7→H 0→A 13→N 18→S 7→H 20→U 14→O 3→D 4→E 3→D 20→U 8→I
```
#### 步骤3：拼接结果
将字符按顺序拼接
**最终Flag**：  
`flag{DUNSHANSHUODEDUI}`\
~~盾山说得对~~
## [Hard]codeForRkk
:::note[描述]
RKK 为了报复時雨てる先前把 ta 做成 AI 还出进题目里，特地搭建了 Codeforkk 平台。時雨てる果然中招！安全意识薄弱的 ta 在 Codeforkk 上提交了一段有漏洞的代码！为了一雪前耻，请你帮助 RKK，对 ta 的代码发起攻击吧！
:::
### 解题思路:
进入页面看到代码中出现了```unordered_map```容器,使用哈希表实现,
这意味着我们只需要在范围内构造大量的质数即可造成哈希冲突,让它的效率大幅下降乃至超时\
在这里我选择使用C++编写一个程序,通过筛法得到题目范围内的2e4个质数并以题目规范格式排列输出\
将内容作为接下来交给teru程序的输入
```
#include<bits/stdc++.h>
using namespace std;
using ll=long long;
constexpr ll MAX=10000000;
bool NPrime[MAX];
int main(){
    freopen("test.txt","w",stdout);
    ll cnt=0;
    vector<ll> prime;
    cout<<(ll)2e4<<endl;
    for(ll i=2;i<MAX&&prime.size()<(ll)2e4;i++) {
        if(NPrime[i])continue;
        cout<<i<<endl;
        prime.push_back(i);
        for(ll j=2;j*i<=MAX;j++) {
            NPrime[j*i]=true;
        }
    }
    cout<<prime.size()<<endl;
    for (auto i : prime) {
        cout<<i<<endl;
    }
    return 0;
}
```
如此即可解决本题
## [Normal]leak_dp
### 解题思路:
没什么好说的\
交给AI直接跑一遍\
![](leak_dp.jpg)
# misc
## [Easy] フラッグモザイク
:::note[描述]
フラッグモザイク (Flag Mosaic)
命名由来：きんいろモザイク~~（没看过这个番，只知道黄金马赛克这个名字梗（x）~~
有涩图看了😋，怎么有可恶的春赛克😡！
现在 AI 这么发达，应该能够找它帮忙去除可恶的春赛克吧！嗯！
:::
### 解题思路:
我们不难知道HIFF是一个可以保存多图层信息的文件\
直接在搜索引擎上寻找HIFF分离工具即可得到flag
## [Easy] 知识问答
:::note[描述]
来看看你对网安知识了解有多深吧！
:::
### 解题思路:
仅需直接询问即可
![](answer1.jpg)
![](answer2.jpg)
# osint
## [Normal]我们一起回去好不好
### 解题思路
首先,我们通过图片的角度可以知道,飞机此时朝向西南,在大学城岛的南边\
第二,我们通过看到翼尖小翼上有航司的logo,搜索中国国内航司的logo进行比对,不难得出是桂林航空\
第三,我们查询桂林航空官网,查看他们的飞行节点都有哪些,注意到在飞机朝向上的节点只有珠海、南宁、海口\
我们在flightaware对这三个机场进行筛选检查\
我们再查看发视频的人的抖音IP——海南\
再看视频发布时间——9.14的凌晨\
我们可以确定其大概为9月中上旬的飞抵海口机场的夜晚航班
很快我们就筛选出了```GT1116```号航班\
在航旅纵横上查询其实际轨迹\
完美符合我们的照片\
接下来查看飞行记录,存在9.13的夜间航班\
最后我们在航旅纵横上通过航班号就可以查询到飞行器注册号\
那么flag就出来了```flag{B1061-GT1116-20250913}```

# web
## [Normal]PacmanOL

:::note[描述]
pacman -S pacman-ol

🐧 ~~来使用 Arch Linux 吧(并非)~~

👻 来玩吃豆人（Pacman）吧！

🏆 拿到 300 分就有奖励哦～
:::
### 解题思路:
调最高倍速老老实实玩游戏达到300分即可喵