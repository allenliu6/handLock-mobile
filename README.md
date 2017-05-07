# handLock-mobile --- *移动端手势密码*  

#### 目标为实现一个可以在基本Android、iOS手机进行手势设置密码，手势验证密码功能的组件，原型设计如下图所示  

![](https://p1.ssl.qhimg.com/t01d73f4b567014b497.png "界面图")
![](https://p5.ssl.qhimg.com/t01ad2dbd1fa3195d55.png "效果图1")
![](https://p3.ssl.qhimg.com/t01e3ccb14544b73cc3.png "效果图2")
![](https://p4.ssl.qhimg.com/t01e29ee99bbe73b256.png "效果图3")
![](https://p4.ssl.qhimg.com/t01698b3be9b0d473e7.png "效果图4")
![](https://p3.ssl.qhimg.com/t01dc54ccf4133d2b06.png "效果图5")
![](https://p1.ssl.qhimg.com/t01410791e9c637add0.png "效果图6")
![](https://p0.ssl.qhimg.com/t019bf08a6f82f1d289.png "效果图7")  

#### 再谈谈实现思路吧  
1. 首先进行技术选型，我个人比较青睐canvas：  
   优点： 1.其整体各种API比较全面  
   2.同时可以进行相互嵌套，重绘性能也还不错  
   不足： 1.其在DOM中是整体存在的  
   2.canvas操作API数目多，比较繁琐    

2. 最后我决定创建三重画布，当然上面的一切其实都是静态的，但事件和交互赋予了他们生命,第一层canvas为最后一条活动的线，第二层canvas为特殊颜色的圆以及圆中的图片，第三层为背景圆基本不动

3. 设置监听touch事件三部曲，针对不同的鼠标移动进行不同层canvas的刷新，过程中进行函数节流

4. 进行功能的逻辑判断，这个只要记录下状态进行比对就没问题了  

#### 计划分为五步：  

~~1.熟悉canvasAPI，制作出界面以及基本动画效果，3月25日前完成（3.25）~~  
~~2.完善所需数据组合，完成设锁逻辑和解锁逻辑，3月27日前完成（好像稍微加了一些封装哦 3.27）~~  
~~3.完成各部分解耦封装，只保留统一接口供调用，并提供适当扩展参数选项，3月29日前完成（好像稍微提前了一些哦 3.28）~~  
~~4.改善UI并适当改善逻辑（逻辑应该还有改善余地，UI更是，未完待续  3.29）~~  
5.改善代码细节问题，规范化  
~~6.追加：canvas渲染机制分层，API改良（暴露过程行为和外观）~~  

#### 接口调用（暂定）：
```js
new touchLock({  
     customStyle: false,                                         //boolean   是否自定义样式
     checkBtn: document.querySelector('#testRadio'),             //check单选框
     updataBtn: document.querySelector('#setRadio'),             //updata单选框
     hint: document.querySelector('#hint'),                      //消息提示框
     background: 'url("background2.jpeg")',                      //url    container背景
     textColor: '#fff',                                          //文字颜色
     rightColor: '#8cf939',                                      //选择正确后空心圆的颜色
     wrongColor: '#fb4920',                                      //选择错误后空心圆的颜色
     canvasWidth: false,                                         //是否自定义canvas宽度
     chooseType: 3,                                              //手势密码圆数量 默认为3*3
     render: true,                                               //自动渲染
     originR: 0.3,                                               //半径占圆心距的比例
     customFilledPicUrl: `./yellowMan/filledPic.png`,            //填充空心圆图片相对路径，filledPic + index确认唯一图片---形如`./yellowMan/filledPic${index}.png`
     customFilledPicNumber: 19,                                  //填充空心圆图片的总数 
     minPoint: 5,                                                //手势密码的最小连接数目
}).init()  
```
