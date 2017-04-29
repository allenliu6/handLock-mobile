/*
    控制touchmove事件触发次数   经过一些测试，暂时定为40ms一次
    大量使用es6,需要浏览器支持度较高

    1.lastPoint  初始化     
    3.retina 2倍缩放
    4.UI按钮  label

    5.四层canvas   九个原始圆  最后一条线  环颜色？？  圆中图 
    6.封装API  事件反馈  调用结果 endcallback   优雅弹窗
    7.ctx的统一样式  颜色 宽度等
    
    BUG  小黄人出现延迟 偶尔清空    img已经onload却未显示   怀疑是图片初始化延迟 
 */

'use strict'

/**
 * 整体构造函数，如何设计API，该暴露什么封装什么？ 面向切面增加回调
 * @param  {number}  n表示圆点数目
 * @param  {function}  占坑回调
 */
window.touchLock = function({n = 3, endCallback} = {n:3}){
    this.chooseType = n
    this.endCallback = endCallback || function(){}
} 

Object.assign(touchLock.prototype, {
    init(){
        this.initDom()
        this.initData()

        //页面初始化
        this.drawCircle()
        this.addEvent()
    },
    initDom(){
        let content = document.createElement('div'),
            str = `
                <div id="container" style="width:100%;position:relative;overflow:hidden;padding-top:100%;height:0px;">
                    <canvas id="lastLine" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) scale(0.5);"></canvas>
                    <canvas id="canvas" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) scale(0.5);">
                        <p>Your browser does not support the canvas element.</p> 
                    </canvas>
                </div>
                <p id="title" style="font-size:28px;font-weight:bold;margin-bottom: 10%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    请输入手势密码
                </p>
                <form style="font-size:20px;">
                    <input id="setRadio" name="mode" type="radio" checked>
                    <label for ="setRadio">设置密码</label>
                    <input id="testRadio" name="mode" type="radio">
                    <label for="testRadio">验证密码</label>
                </form>`.trim()

        content.setAttribute('style', `position: absolute;left: 0;right: 0;top: 0;bottom: 0;text-align: center;
            color: #fff;
            background-image:url("background2.jpeg"); background-position: center 0;
            background-repeat: no-repeat; background-attachment:fixed; background-size: cover;`.trim())

        content.innerHTML = str
        document.body.appendChild(content)
    },

    initData(){
        let  container = document.querySelector('#container'),
             width = container.getBoundingClientRect().width

        this.canvas = container.querySelector('#canvas')
        this.lastLine = container.querySelector('#lastLine')

        this.ctx = this.canvas.getContext('2d')
        this.lastLinectx = this.lastLine.getContext('2d')

        this.canvas.width = width * 2
        this.canvas.height = width * 2
        this.lastLine.width = width * 2
        this.lastLine.height = width * 2

        //数据初始化
        this.width = width * 2
        this.computeCircle(this.chooseType);     //计算圆的分布,圆心坐标、半径分别存储在 roundCenter r中
        this.lastPoint = undefined               //上一个经过的圆心序号，即record的最后一个元素的序号    undefined表示当前为第一步   
        this.record = []                         //当前按序走过的所有圆的序号   record: [5,6,3]
        this.tempRecord = []                     //临时存储圆的序号，设置重复验证时，验证密码时暂存与localStorage的数据
        
        this.testStep = 0                        //表示验证或设置密码的情况     0表示没设置密码  1表示设置过一次密码需要再确认  2表示设置成功密码，存储到localStorage.handPassword  若不成功则重新回到0
        this.timer = true                        //true表示当前可以进行touchmove回调函数，false则相反
        this.eventStatus = false                 //表示事件当前状态  在start前是false start后变为true  end够变为false
        
        this.yellowMan = []                      
        this.computeYellowMan()                  //初始化圆中图案序号
    },

    // 创建解锁点的坐标，根据canvas的大小来平均分配半径   并遍历绘制出来
    computeCircle(){
        let n = this.chooseType,// 画出n*n的矩阵 
            arr = [],
            r = this.width / (3 * (n + 1));// 公式计算 半径和canvas的大小有关

        for (let i = 1 ; i <= n ; i++) {
            for (let j = 1 ; j <= n ; j++) {
                arr.push({
                    x: j * 3 * r,
                    y: i * 3 * r
                });
            }
        }

        this.roundCenter = arr
        this.r = r
    },
    //初始化小黄人的序号
    computeYellowMan(){
        let s = new Set()
        while(s.size !== 9){
            s.add(Math.ceil(Math.random() * 19))
        }
        this.yellowMan = [...s]
    },
    drawCircle(){//将大圆绘制出来
        for (let val of this.roundCenter) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(val.x, val.y, this.r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    },

    //@Params当前圆的次序  使经过的圆里面呈现图片  每次固定都是一张图片但需要不断刷新
    drawContainer(index){
        let pic = new Image(),
            val = this.roundCenter[index]; 

       /* pic.onload = function(){
            console.log(index)
        }*/
        pic.src =`./yellowMan/${this.yellowMan[index]}.png`;  
        this.ctx.drawImage(pic, val.x-this.r*2/3, val.y-this.r*2/3, this.r*1.5, this.r*1.5);  
    },
    //@Params颜色字符串转换初始圆的颜色形成并启动画小圆函数   
    drawStatusPoint(color){
        for (let index of this.record) {
            this.ctx.strokeStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(this.roundCenter[index].x, this.roundCenter[index].y, this.r, 0, Math.PI * 2);
            this.ctx.stroke();

            this.drawContainer(index)
        }  
    },
   
    //@Params 鼠标在画布中的坐标值  测试点是否在解锁点内  若解锁点在点内则添加到记录里   4\5让动画更自然一些？？ @returns 如果经过新点则true 否则false
    testPosition(x, y){
        for(let index of this.roundCenter.keys()){
            if (Math.abs(x * 2 - this.roundCenter[index].x) < this.r && Math.abs(y * 2 - this.roundCenter[index].y) < this.r) {
               for(let i of this.record){
                    if (i === index)  return false
                }
                this.lastPoint = index
                this.record.push(index)
                return true
            }
        }
        return false
    },
    //每次touchmove渲染画布内容包括小圆以及连线
    updata(){
        let lastcircle

        this.drawCircle()
        for(let index of this.record){
            this.drawContainer(index)
            
            if (lastcircle) {
                this.drawLine(this.ctx, lastcircle, this.roundCenter[index])
                lastcircle = this.roundCenter[index]
            }else{
                lastcircle = this.roundCenter[index]
            }
        }
    },
    
    //添加touch事件
    addEvent(){
        let _this = this
        this.canvas.addEventListener('touchstart', function(e){//测试当前位置数据并进行处理   触发频率高，所以不需要start时验证
            e.preventDefault();
            _this.eventStatus = true
        })

        this.canvas.addEventListener('touchmove', function(e){//测试当前位置数据并进行处理
            if (_this.eventStatus) {
                if (_this.timer) {
                    let rect = e.currentTarget.getBoundingClientRect(),
                        x = e.touches[0].clientX - rect.left,
                        y = e.touches[0].clientY - rect.top

                   if( _this.testPosition(x, y)){
                        _this.resetDraw(_this.ctx)
                        _this.updata()
                   }

                    _this.resetDraw(_this.lastLinectx)
                    if(_this.record.length) 
                        _this.drawLine(_this.lastLinectx, _this.roundCenter[_this.record[_this.record.length - 1]], {x: x * 2,y: y * 2})
                    _this.timer = false

                    //函数节流
                    setTimeout(function(){
                        _this.timer = true
                    },40)
                }
            }
        })

        this.canvas.addEventListener('touchend', function(e){
            if (_this.eventStatus) {
                _this.eventStatus = false
                _this.dealPassword()
                _this.record = []
                _this.lastPoint = undefined
                _this.computeYellowMan()

                _this.endCallback && _this.endCallback()
                //延迟重置画布，保留结果
                setTimeout(function(){
                    _this.resetDraw(_this.ctx, _this.lastLinectx)
                    _this.drawCircle()
                }, 300);
            }
        })
        this.canvas.addEventListener('touchmove', function(e){
            e.preventDefault();
        })
    },

    //公共API
    //@Params起始点和重点坐标对象  在两个点之间连线
    drawLine(ctx, begin, end){
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(begin.x, begin.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
    },
    //重置画布
    resetDraw(...ctx){
        for(let canvas of ctx){
            canvas.clearRect(0, 0, this.width, this.width)
        }
    },





    //设置时判断长度以及重复验证   step为2和0在设置时表现相同
    setPassword(){
        if(this.testStep === 1) {
            if (this.record.length !== this.tempRecord.length) {
                title.innerHTML = '输入不一致,请重新输入'
                this.drawStatusPoint('#fb4920')
                this.testStep = 0
            }else{
                let isSame = true
                for(let i = 0,l = this.record.length; i < l; i++){
                    if (this.record[i] !== this.tempRecord[i]) {
                        isSame = false
                    }
                }
                if (isSame) {
                    title.innerHTML = '密码设置成功'
                    this.drawStatusPoint('#8cf939')
                    this.testStep = 2
                    window.localStorage.handPassword = this.tempRecord.join(' ')
                }else{
                    title.innerHTML = '输入不一致,请重新输入'
                    this.drawStatusPoint('#fb4920')
                    this.testStep = 0
                    this.tempRecord = []
                }
            }
        }
        else{
            title.innerHTML = '请再次输入手势密码'
            this.drawStatusPoint('#8cf939')
            this.tempRecord = this.record
            this.record = []
            this.testStep = 1
        }
    },
    //验证时判断与localstorage中数据是否相同
    testPassword(){
        let isSame = true

        for(let i = 0,l = this.record.length; i < l; i++){
            if (this.record[i] !== parseInt(this.tempRecord[i])) {
                isSame = false
            }
        }
        if (isSame) {
            title.innerHTML = '密码正确'
            this.drawStatusPoint('#8cf939')
        }else{
            title.innerHTML = '输入密码不正确'
            this.drawStatusPoint('#fb4920')
        }
    },
    //验证输入是否符合当前规则，并分别进行处理
    dealPassword(){
        let setRadio = document.getElementById('setRadio'),
            testRadio = document.getElementById('testRadio'),
            title = document.getElementById('title')

        if (setRadio.checked) {
            if (this.record.length < 5) {
                title.innerHTML = '密码太短，至少需要5个点'
                this.drawStatusPoint('#fb4920')
                this.testStep = 0
                return
            }
            this.setPassword()
            return
        }

        this.tempRecord = window.localStorage.handPassword.split(' ')
        if (testRadio.checked && this.tempRecord.length > 4) {//step保证共用数据没问题 随意切换状态没反应     判断是否在之前已经在localstorage设置过密码

            if (this.record.length !== this.tempRecord.length || this.record.length < 5) {
                title.innerHTML = '输入密码不正确'
                this.drawStatusPoint('#fb4920')
                return
            }
            this.testPassword()
        }
    },
})