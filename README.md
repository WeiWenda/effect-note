<p align="center">
<img alt="SiYuan" width="128px" src="./public/images/icon.png">
<br>
一款开源的大纲笔记软件，纯文件存储，Gitee云端同步，Copy Confluence & Workflowy
<br><br>
<a title="Releases" target="_blank" href="https://github.com/siyuan-note/siyuan/releases"><img src="https://img.shields.io/github/release/siyuan-note/siyuan.svg?style=flat-square&color=FF9900"></a>
<a title="Downloads" target="_blank" href="https://github.com/siyuan-note/siyuan/releases"><img src="https://img.shields.io/github/downloads/siyuan-note/siyuan/total.svg?style=flat-square&color=blueviolet"></a>
<a title="Docker Pulls" target="_blank" href="https://hub.docker.com/r/b3log/siyuan"><img src="https://img.shields.io/docker/pulls/b3log/siyuan.svg?style=flat-square&color=99CCFF"></a>
<a title="Hits" target="_blank" href="https://github.com/siyuan-note/siyuan"><img src="https://hits.b3log.org/siyuan-note/siyuan.svg"></a>
</p>

# 这是一款大纲笔记软件，主要借鉴了Confluence和WorkFlowy，同时遵循以下设计理念：
## 1. 基于本地文件存储
文件扩展名为.effect.json
使用Git进行云端备份和历史回溯
## 2. 代码开源
<a class='' target="_blank" href="https://github.com/WeiWenda/effect-note">GitHub地址</a>
源码为js全栈（react+electron+node），欢迎star、issue、pr
## 3. 关注内容，兼顾可视化
支持markdown文本
支持Drawio流程图
支持内容转换为思维导图
## 4. 定位个人知识库构建工具，放弃多人协作
### 已支持的导入格式
markdown文件
workflowy文本
.effect.json文本
图片识别
### 已支持的导出格式
pdf文件
markdown文件
.effect.json文本
workflowy文本
ics日历文件
# 帮助文档
## 设置工作空间

## 新建笔记

保存并自动备份至Git仓库
## 历史回溯

## 演示模式

文本操作
## 节点操作

### 展开
#### 节点展开在导航菜单处有快捷入口，作用域为当前视图的根节点

### 插入特殊块
#### markdown
[GitHub地址](https://github.com/WeiWenda/effect-note)

```java
//javascript代码
async function deleteFile(file) {
  return fs.promises.unlink(file)
}
```

> 引用内容

* [ ]  checklist
* [ ]  todo1
* [X]  todo2

#### 富文本
<div class='node-html'><p> <a href="https://github.com/WeiWenda/effect-note" target="_blank">GitHub地址</a> </p><pre><code class="language-javascript">//javascript代码
async function deleteFile(file) {
  return fs.promises.unlink(file)
}</code></pre><blockquote> 引用内容</blockquote><div data-w-e-type="todo"><input type="checkbox" disabled >checklist</div><div data-w-e-type="todo"><input type="checkbox" disabled >todo1</div><div data-w-e-type="todo"><input type="checkbox" disabled checked>todo2</div></div>
#### 思维导图
##### 1
2
##### 3
###### 4
5
6
#### 流程图

文本识别
### 标记
#### 收藏
##### 在任意节点输入@号之后，可以引用之前收藏的节点，类似html的锚记
标记收藏的节点
引用 @标记收藏的节点
##### 调出右边栏后，可以在收藏Tab下看到目前已收藏的所有节点

##### 节点收藏在进入节点后的导航菜单处有快捷入口

#### 标签
##### 下拉可以快速选择重要程度相关的标签
「关键」标签示例
「重要」标签示例
「注意」标签示例
##### 也可以直接键盘输入任意内容
「任意内容」标签示例
调出右边栏后，可以在标签Tab下看到同一标签下的所有节点
#### 任务
为节点标记预期完成时间、开始时间和结束时间
##### 标记完成后生成特殊的完成进度标签
Doing示例
Todo示例
Done示例
Delay示例
##### 快捷键ctrl+enter可以将光标所在节点，标记上完成时间为now，并且为节点划上删除线
~~节点完成示例~~
##### 笔记导出ics文件时，将导出所有标记过完成时间的节点
ics文件可以导入系统日历或Google日历
### 清空
特殊块无法选中删除，因此需要在节点操作中删除内容
### 导入
#### 导入网页内容
使用Web Clipper提取md格式的网页内容
导入md
导出
## 笔记操作

重命名、修改分类标签
删除
保存
导出内容
## 快捷键列表
点击圆点进入子块
点击折叠按钮，收起或展开内容
<div class='node-html'><table style="width: auto;"><tbody><tr><th colSpan="1" rowSpan="1" width="153">操作</th><th colSpan="1" rowSpan="1" width="161.1">window快捷键</th><th colSpan="1" rowSpan="1" width="165.65">mac快捷键</th></tr><tr><td colSpan="1" rowSpan="1" width="auto">撤销</td><td colSpan="1" rowSpan="1" width="auto">ctrl+z</td><td colSpan="1" rowSpan="1" width="auto">command+z</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">重做</td><td colSpan="1" rowSpan="1" width="auto">ctrl+shift+z</td><td colSpan="1" rowSpan="1" width="auto">command+shift+z</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">复制</td><td colSpan="1" rowSpan="1" width="auto">ctrl+c</td><td colSpan="1" rowSpan="1" width="auto">command+c</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">粘贴</td><td colSpan="1" rowSpan="1" width="auto">ctrl+v</td><td colSpan="1" rowSpan="1" width="auto">command+v</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">剪切</td><td colSpan="1" rowSpan="1" width="auto">ctrl+x</td><td colSpan="1" rowSpan="1" width="auto">command+x</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">删除</td><td colSpan="1" rowSpan="1" width="auto">delete</td><td colSpan="1" rowSpan="1" width="auto">delete</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">标记完成</td><td colSpan="1" rowSpan="1" width="auto">ctrl+enter</td><td colSpan="1" rowSpan="1" width="auto">command+enter</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">保存</td><td colSpan="1" rowSpan="1" width="auto">ctrl+s</td><td colSpan="1" rowSpan="1" width="auto">command+s</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">刷新</td><td colSpan="1" rowSpan="1" width="auto">ctrl+r</td><td colSpan="1" rowSpan="1" width="auto">command+r</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">缩进&gt;&gt;</td><td colSpan="1" rowSpan="1" width="auto">tab</td><td colSpan="1" rowSpan="1" width="auto">tab</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">缩进&lt;&lt;</td><td colSpan="1" rowSpan="1" width="auto">shift+tab</td><td colSpan="1" rowSpan="1" width="auto">shift+tab</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">光标至行首</td><td colSpan="1" rowSpan="1" width="auto">home</td><td colSpan="1" rowSpan="1" width="auto">home</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">光标至行尾</td><td colSpan="1" rowSpan="1" width="auto">end</td><td colSpan="1" rowSpan="1" width="auto">end</td></tr><tr><td colSpan="1" rowSpan="1" width="auto">键盘选中内容</td><td colSpan="1" rowSpan="1" width="auto">shift+上下左右</td><td colSpan="1" rowSpan="1" width="auto">shift+上下左右</td></tr></tbody></table><p><br></p></div>
# 版本历史
## v0.1.0
第一个版本
## v0.2.0
### New Features
增加markdown特殊块
增加markdown导入导出
增加节点标记（收藏、标签、完成）
增加Discovery版块
### Fix
导出pdf内容不全
滚动条抖动
## v0.2.1
### New Features
支持圆点拖拽
支持文本选中修改样式
工具栏增加展开层级下拉按钮
支持特殊节点复制
### Fix
修复无法在特殊节点后添加新节点
## v0.2.2
### Improvement
优化全局搜索的速度
优化特殊块的展示效果
### New Features
增加页面主题切换
增加工作空间切换
增加ics日历格式导出（只导出有任务标记的节点）
### Fix
刷新后面包屑导航展示异常
## v0.2.3
### New Features
支持文本选中添加超链接
支持目录右键进行文件重命名
# LICENSE
<a class='' target="_blank" href="https://github.com/facebook/react/">react</a>
<a class='' target="_blank" href="https://github.com/WuTheFWasThat/vimflowy">vimflowy</a>
<a class='' target="_blank" href="https://github.com/ant-design/ant-design">ant-design</a>
<a class='' target="_blank" href="https://github.com/isomorphic-git/isomorphic-git">isomorphic-git</a>
<a class='' target="_blank" href="https://github.com/electron/electron">electron</a>
<a class='' target="_blank" href="https://github.com/wangeditor-team/wangEditor">wangEditor</a>
<a class='' target="_blank" href="https://github.com/Vanessa219/vditor">vditor</a>
<a class='' target="_blank" href="https://github.com/naptha/tesseract.js">tesseract.js</a>
<a class='' target="_blank" href="https://github.com/jgraph/drawio">drawio</a>
<a class='' target="_blank" href="https://github.com/nhn/tui.image-editor">tui.image-editor</a>
<a class='' target="_blank" href="https://github.com/olivernn/lunr.js">lunr.js</a>
