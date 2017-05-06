/*
    控制touchmove事件触发次数   经过一些测试，暂时定为40ms一次
    大量使用es6,需要浏览器支持度较高

    1.lastPoint  初始化     
    3.retina 2倍缩放
    4.UI按钮  label

    5.三层canvas   九个原始圆  最后一条线  特殊颜色环和圆中图      修改某些重置为添加!  
         * 三层canvas初始化 从下到上
         * backround  背景圆，即初始化可以看到的圆
         * lastLine   动态线，随鼠标移动而动，刷新最多
         * canvas     主要动态效果呈现   包括圆中图片，以及用特殊颜色圆覆盖背景圆
         
    6.封装API  过程： 事件反馈  调用结果 endcallback   优雅弹窗
              外观： 暴露ctx的统一样式  颜色 宽度等
    7.简略代码  canvasAPI  填充颜色 大小 样式统一     this.xxx转变为局部变量
    
    BUG  
        小黄人出现延迟 偶尔清空    img已经onload却未显示   怀疑是图片初始化延迟  多解锁几次BUG消除？    
            已解决    图片未完全加载即draw

    {   
        container: Dom    若null则自动创建     给出container如何确定width和height
        customStyle: boolean   是否自定义样式
        background: url    container背景
        textColor:
        rightColor:
        wrongColor:
        width:
        height:
        chooseType:
        render:    自动渲染
        originR: 0.3   半径占圆心距的比例
        customFilledPic:
    }
 */
{
'use strict'
    /*
    * canvas 公共API
    */
    /**
     * 绘制线段
     * @param {DOM} ctx canvas的context
     * @param {object} begin 坐标对象，表示起点，键值为 x,y
     * @param {object} end 坐标对象，表示终点，键值为x,y
     */
    function drawLine(ctx, begin, end){
        ctx.lineWidth = 3
        ctx.strokeStyle = '#fff'
        ctx.beginPath();
        ctx.moveTo(begin.x, begin.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
    }
    /**
     * 重置指定画布
     * @param {DOMarray} ctx canvas的context数组
     * @param {number} width 需要清除的canvas长度
     */
    function resetDraw(ctx, width){
        ctx.clearRect(0, 0, width, width)
    }
    /**
     * 绘制空心圆
     * @param {DOM} ctx canvas的context
     * @param {array} roundCenter 圆心坐标数组
     * @param {number} r 圆半径
     */
    function drawHollowCircle(ctx, roundCenterArr, r, color = '#fff'){
        for (let val of roundCenterArr) {
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.beginPath();
            ctx.arc(val.x, val.y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    /**
     * 使用图片填充空心圆
     * @param {DOM} ctx canvas的context
     * @param {object} val 坐标对象 包含x,y
     * @param {string} src 填充图片的相对路径
     * @param {number} r 空心圆的半径
     */
    function drawContent(ctx, val, src, r){
        let pic = new Image()
            
        pic.src = src
        pic.onload = function(){
            ctx.drawImage(pic, val.x-r*2/3, val.y-r*2/3, r*1.5, r*1.5)
        }
    }
   /**
    * 转换屏幕坐标值为canvas坐标值
    * @param {DOM} canvas canvas DOM
    * @param {number} x 横坐标值
    * @param {number} y 纵坐标值
    */
    function getCanvasPoint(canvas, x, y){
        let rect = canvas.getBoundingClientRect()
        return {
            x: 2 * (x - rect.left), 
            y: 2 * (y - rect.top),
        }
    }
    /**
    * 初始化图片的序号  每次事件循环后重复执行一次，进行图片更新
    * @param {object} filledPic 随机图片序号数组
    */
    function computeFilledPic(filledPic){
        let s = new Set(),
            arr = []

        while(s.size !== 9){
            s.add(Math.ceil(Math.random() * 19))
        }
        arr = [...s]
        arr.forEach(function(element, index) {
            this[index] = element
        }, filledPic)
    }


/**
 * 整体构造函数，如何设计API，该暴露什么封装什么？ 面向切面增加回调
 * @param  {number}  n表示圆点数目
 * @param  {function}  占坑回调
 */
window.locker = function({n = 3, endCallback, originR = 0.3, container} = {n: 3, originR: 0.3}){
    this.chooseType = n
    this.endCallback = endCallback || function(){}
    this.originR = originR
    this.container = container
    this.init()
}
function recorder(){
    
}
locker.prototype = Object.create(recorder)

Object.assign(locker.prototype, {
    //设置时判断长度以及重复验证   step为2和0在设置时表现相同
    setPassword(){
        let roundCenterArr = [],
            wrongColor = '#fb4920',
            rightColor = '#8cf939',
            {record, roundCenter, tempRecord, r, ctx} = this

        for(let index of record){
            roundCenterArr.push(roundCenter[index])
        }
        if(this.testStep === 1) {
            if (record.length !== tempRecord.length) {
                title.innerHTML = '输入不一致,请重新输入'
                drawHollowCircle(ctx, roundCenterArr, r, wrongColor)
                this.testStep = 0
            }else{
                let isSame = true
                for(let i = 0,l = record.length; i < l; i++){
                    if (record[i] !== tempRecord[i]) {
                        isSame = false
                    }
                }
                if (isSame) {
                    title.innerHTML = '密码设置成功'
                    drawHollowCircle(ctx, roundCenterArr, r, rightColor)
                    this.testStep = 2
                    window.localStorage.handPassword = tempRecord.join(' ')
                }else{
                    title.innerHTML = '输入不一致,请重新输入'
                    drawHollowCircle(ctx, roundCenterArr, r, wrongColor)
                    this.testStep = 0
                    tempRecord = []
                }
            }
        }
        else{
            title.innerHTML = '请再次输入手势密码'
            drawHollowCircle(ctx, roundCenterArr, r, rightColor)
            tempRecord = record
            this.testStep = 1
        }
    },
    //验证时判断与localstorage中数据是否相同
    testPassword(){
        let isSame = true,
            wrongColor = '#fb4920',
            rightColor = '#8cf939',
            {record, tempRecord, ctx, r,} = this,
            roundCenterArr = []

        for(let index of record){
            roundCenterArr.push(roundCenter[index])
        }
        for(let i = 0,l = record.length; i < l; i++){
            if (record[i] !== parseInt(tempRecord[i])) {
                isSame = false
            }
        }
        if (isSame) {
            title.innerHTML = '密码正确'
            drawHollowCircle(ctx, roundCenterArr, r, rightColor)
        }else{
            title.innerHTML = '输入密码不正确'
            drawHollowCircle(ctx, roundCenterArr, r, wrongColor)
        }
    },
    //验证输入是否符合当前规则，并分别进行处理
    dealPassword(){
        let setRadio = document.getElementById('setRadio'),
            testRadio = document.getElementById('testRadio'),
            title = document.getElementById('title'),
            wrongColor = '#fb4920',
            rightColor = '#8cf939',
            {record, ctx, r, tempRecord, roundCenter} = this,
            roundCenterArr = []

        for(let index of record){
            roundCenterArr.push(roundCenter[index])
        }

        if (setRadio.checked) {
            if (record.length < 5) {
                title.innerHTML = '密码太短，至少需要5个点'
                drawHollowCircle(ctx, roundCenterArr, r, wrongColor)
                this.testStep = 0
                return
            }
            this.setPassword()
            return
        }

       tempRecord = window.localStorage.handPassword.split(' ')
        //step保证共用数据没问题 随意切换状态没反应     判断是否在之前已经在localstorage设置过密码
        if (testRadio.checked && tempRecord.length > 4) {
            if (record.length !== tempRecord.length || record.length < 5) {
                title.innerHTML = '输入密码不正确'
                drawHollowCircle(ctx, roundCenterArr, r, wrongColor)
                return
            }
            this.testPassword()
        }
    },
})

Object.assign(recorder, {
    // 创建解锁点的坐标，根据canvas的大小来平均分配半径   并遍历绘制出来
    computeCircle(){
        let n = this.chooseType,// 画出n*n的矩阵 
            basicNum = this.width / (n + 1), // 公式计算 半径和canvas的大小有关
            arr = []

        for (let i = 1 ; i <= n ; i++) {
            for (let j = 1 ; j <= n ; j++) {
                arr.push({
                    x: j * basicNum,
                    y: i * basicNum
                });
            }
        }

        this.r = this.originR * basicNum
        this.roundCenter = arr
    },
    
    /*
        事件相关
    */
    /**
     * 测试点是否在解锁点内，若解锁点在点内则添加到记录里    （测试：在圆内4\5让动画更自然一些）
     * @param {object}  point {x,y} x 鼠标当前坐标X轴值  y 鼠标当前坐标Y轴值
     * @return {boolean}  如果经过新点则true 否则false
     */
    testPosition(point){
        let {roundCenter, record, r} = this
        for(let index of roundCenter.keys()){
            if (Math.abs(point.x - roundCenter[index].x) < r && Math.abs(point.y - roundCenter[index].y) < r) {
               for(let i of record){
                    if (i === index)  return false
                }
                record.push(index)
                return true
            }
        }
        return false
    },
    init(){
        this.initDom()
        this.initData()
        this.addEvent()
    },
    initDom(){
        let container = this.container || document.createElement('div'),
            str = `
                <div id="main" style="width:100%;position:relative;overflow:hidden;padding-top:100%;height:0px;">
                    <canvas id="backRound" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) scale(0.5);"></canvas>
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
        
        if(!this.container && !this.customStyle){
            Object.assign(container.style, {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                textAlign: 'center',

                color: '#fff',
                background: 'url("background2.jpeg") center 0 no-repeat fixed'
            })
            document.body.appendChild(container)
        }
        this.container = container
        container.innerHTML = str
    },

    initData(){
        let  main = document.querySelector('#main'),
             width = main.getBoundingClientRect().width,
             lastLine = main.querySelector('#lastLine'),
             backRound = main.querySelector('#backRound')

        this.canvas = this.container.querySelector('#canvas')

        this.ctx = this.canvas.getContext('2d')
        this.lastLinectx = lastLine.getContext('2d')

        this.canvas.width = width * 2
        this.canvas.height = width * 2
        lastLine.width = width * 2
        lastLine.height = width * 2
        backRound.width = width * 2
        backRound.height = width * 2

        //数据初始化
        this.width = width * 2
        this.computeCircle(this.chooseType);     //计算圆的分布,圆心坐标、半径分别存储在 roundCenter r中
        this.record = []                         //当前按序走过的所有圆的序号   record: [5,6,3]
        this.filledPic = []                      
        computeFilledPic(this.filledPic)                  //初始化圆中图案序号

        this.tempRecord = []                     //临时存储圆的序号，设置重复验证时，验证密码时暂存与localStorage的数据     可以干掉
        this.testStep = 0                        //表示验证或设置密码的情况     0表示没设置密码  1表示设置过一次密码需要再确认  2表示设置成功密码，存储到localStorage.handPassword  若不成功则重新回到0   可以干掉

        drawHollowCircle(backRound.getContext('2d'), this.roundCenter, this.r)
    },

    
    //添加touch事件
    addEvent(){
        let _this = this,
            eventStatus = false,    //表示事件当前状态  在start前是false start后变为true  end够变为false
            timer = true,           //true表示当前可以进行touchmove回调函数，false则相反
            {ctx, lastLinectx, roundCenter, width, r, endCallback, filledPic, record} = this

        //触发频率高，所以不需要start时验证
        this.canvas.addEventListener('touchstart', function(e){
            eventStatus = true
        })

        //测试当前位置数据并进行处理
        this.canvas.addEventListener('touchmove', function(e){
            if (eventStatus && timer) {
                let touch = e.touches[0],
                    currentPoint = getCanvasPoint(this, touch.clientX, touch.clientY)
                
                //画圆心连线和绘制圆内图
                if(_this.testPosition(currentPoint)){
                    let len = record.length,
                        lastPoint = roundCenter[record[len - 1]],
                        beforeLastPoint = roundCenter[record[len - 2]]

                     if(record.length > 1){
                        drawLine(ctx, beforeLastPoint, lastPoint)
                     }
                     drawContent(ctx, lastPoint, `./yellowMan/${filledPic[record[len - 1]]}.png`, r)
                }

                //绘制最后一条线
                resetDraw(lastLinectx, width)
                if(record.length) 
                    drawLine(lastLinectx, roundCenter[record[record.length - 1]], currentPoint)
                timer = false

                //函数节流
                setTimeout(function(){
                    timer = true
                },40)
            }
        })

        this.canvas.addEventListener('touchend', function(e){
            if (eventStatus) {
                eventStatus = false
                _this.dealPassword()
                record.length = 0
                computeFilledPic(filledPic)

                endCallback && endCallback()
                //延迟重置画布，保留结果
                setTimeout(function(){
                    resetDraw(ctx, width)
                    resetDraw(lastLinectx, width)
                }, 300);
            }
        })
        this.canvas.addEventListener('touchmove', function(e){
            e.preventDefault();
        })
    },
})
}