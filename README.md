# handLock-mobile
移动端手势密码

> 目标位实现一个可以在基本Android、iOS手机进行手势设置密码，手势验证密码功能的组件，原型设计如下图所示  


![](https://p1.ssl.qhimg.com/t01d73f4b567014b497.png "界面图")
![](https://p5.ssl.qhimg.com/t01ad2dbd1fa3195d55.png "效果图1")
![](https://p3.ssl.qhimg.com/t01e3ccb14544b73cc3.png "效果图2")
![](https://p4.ssl.qhimg.com/t01e29ee99bbe73b256.png "效果图3")
![](https://p4.ssl.qhimg.com/t01698b3be9b0d473e7.png "效果图4")
![](https://p3.ssl.qhimg.com/t01dc54ccf4133d2b06.png "效果图5")
![](https://p1.ssl.qhimg.com/t01410791e9c637add0.png "效果图6")
![](https://p0.ssl.qhimg.com/t019bf08a6f82f1d289.png "效果图7")  
> 再谈谈实现思路吧 


1.首先肯定是个画布任我门自由驰骋了，上面的一切其实都是静态的，但事件和交互赋予了他们生命  
2.监听touch事件三部曲，不断进行canvas的刷新，先记录下当前touch的位置和之前move的位置，然后清除整个画布，重新渲染，不间断进行渲染过程形成帧的变化（本来还以为canvas会有高大上的撤销API ~_~）  

3.进行功能的逻辑判断，这个只要记录下状态进行比对就没问题了

计划分为三步：  
~~1.熟悉canvasAPI，制作出界面以及基本动画效果，3月25日前完成~~  
~~2.完善所需数据组合，完成设锁逻辑和解锁逻辑，3月27日前完成（好像稍微加了一些封装哦）~~  
3.完成各部分解耦封装，只保留统一接口供调用，并提供适当扩展参数选项，3月29日前完成  
