/*
    控制touchmove事件触发次数   经过一些测试，暂时定为40ms一次
    大量使用es6,需要浏览器支持度较高

    3.retina 2倍缩放
    4.UI按钮  label
    5.三层canvas   九个原始圆  最后一条线  特殊颜色环和圆中图      修改某些重置为添加!  
         * 三层canvas初始化 从下到上
         * backround  背景圆，即初始化可以看到的圆
         * lastLine   动态线，随鼠标移动而动，刷新最多
         * canvas     主要动态效果呈现   包括圆中图片，以及用特殊颜色圆覆盖背景圆
    7.简略代码 this.xxx转变为局部变量    简化对象存储变量   
    6.封装API  过程： 事件反馈  调用结果 endcallback   优雅弹窗
              外观： 暴露ctx的统一样式  颜色 宽度等
              
    8.检错机制  异步事件代码转为伪同步
    
    BUG  
        小黄人出现延迟 偶尔清空    img已经onload却未显示   怀疑是图片初始化延迟  多解锁几次BUG消除？    
            已解决    图片未完全加载即draw
 */
{'use strict'
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
    * @param {number} num 图片文件数量    
    */
    function computeFilledPic(filledPic, num){
        let s = new Set(),
            arr = []

        while(s.size !== 9){
            s.add(Math.ceil(Math.random() * num))
        }
        arr = [...s]
        arr.forEach(function(element, index) {
            this[index] = element
        }, filledPic)
    }


/**
 * 整体构造函数，如何设计API，该暴露什么封装什么？ 面向切面增加回调
 * @param {object} options 传入参数对象
 */
window.locker = function(options = {}){
    let defaultOptions = {
            update: {
                beforeRepeat: function(){},
                afterRepeat: function(){},
            },
            check: {
                afterCheck: function(){}
            }
        },
        updata = Object.assign({}, defaultOptions.update, options.update),
        check = Object.assign({}, defaultOptions.check, options.check)
    
    this.init(options)
    this.initLocker(updata, check)
}
function recorder(){
    
}
locker.prototype = Object.create(recorder)

Object.assign(locker.prototype, {
    initLocker(updata, check){
        let {ctx, r, roundCenter} = this,
            {rightColor, wrongColor, checkBtn, updataBtn, hint} = this.options,
            tempRecord = []                     //设置重复验证时，临时存储圆的序号    验证密码时暂存localStorage的数据

        console.log(this)
        this.dealPassword = function(record){
            let roundCenterArr = []

            for(let index of record){
                roundCenterArr.push(roundCenter[index])
            }
            console.log(record.length)
            if (updataBtn.checked) {
                if (record.length < 5) {
                    setResult(false, '密码太短，至少需要5个点')
                    tempRecord = []
                    return
                }
                setPassword()
                return
            }

            //step保证共用数据没问题 随意切换状态没反应     判断是否在之前已经在localstorage设置过密码
            tempRecord = window.localStorage.handPassword.split(' ')
            if(tempRecord.length > 4) {
                if (record.length !== tempRecord.length || record.length < 5) {
                    setResult(false, '输入密码不正确')
                    return
                }
                testPassword()
            }
            tempRecord = []

            //设置时判断长度以及重复验证   step为2和0在设置时表现相同
            function setPassword(){
                if(tempRecord.length) {
                    updata.beforeRepeat()
                    if (record.length !== tempRecord.length) {
                        setResult(false, '输入不一致,请重新输入')
                        tempRecord = []
                    }else{
                        for(let i = 0,l = record.length; i < l; i++){
                            if (record[i] !== tempRecord[i]) {
                                setResult(false, '输入不一致,请重新输入')
                                tempRecord = []
                                return 
                            }
                        }
                        setResult(true, '密码设置成功')
                        window.localStorage.handPassword = tempRecord.join(' ')
                    }
                    updata.afterRepeat()
                }else{
                    setResult(true, '请再次输入手势密码')
                    tempRecord = [...record]
                }
            }

            //验证时判断与localstorage中数据是否相同
            function testPassword(){
                for(let i = 0,l = record.length; i < l; i++){
                    if (record[i] !== parseInt(tempRecord[i])) {
                        setResult(true, '输入密码不正确')
                    }
                }
                setResult(true, '密码正确')
                check.afterCheck()
            }

            function setResult(res, message){         
                hint.innerHTML = message
                drawHollowCircle(ctx, roundCenterArr, r, res? rightColor: wrongColor)
            }
        }
    }
})
// 
Object.assign(recorder, {
    /**
     * 创建解锁点的坐标，根据canvas的大小来平均分配半径以及与圆心坐标
     * @param {number}  n 画出n*n的矩阵 
     * @param {number}  originR 半径与圆心距的比率
     */
    computeCircle(n, originR){
        let basicNum = this.width / (n + 1), // 公式计算 半径和canvas的大小有关
            arr = []

        for (let i = 1 ; i <= n ; i++) {
            for (let j = 1 ; j <= n ; j++) {
                arr.push({
                    x: j * basicNum,
                    y: i * basicNum
                });
            }
        }

        this.r = originR * basicNum
        this.roundCenter = arr
    },
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

    init(options){
        let  container = options.container || document.createElement('div'),   
            str = `
                <div id="main" style="width:100%;position:relative;overflow:hidden;padding-top:100%;height:0px;">
                    <canvas id="backRound" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) scale(0.5);"></canvas>
                    <canvas id="lastLine" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) scale(0.5);"></canvas>
                    <canvas id="canvas" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) scale(0.5);">
                        <p>Your browser does not support the canvas element.</p> 
                    </canvas>
                </div>`.trim()

        if(!options.checkBtn && !options.updataBtn){
            str += ` <form style="font-size:20px;">
                        <input id="setRadio" name="mode" type="radio" checked>
                        <label for ="setRadio">设置密码</label>
                        <input id="testRadio" name="mode" type="radio">
                        <label for="testRadio">验证密码</label>
                    </form>`.trim()
        }

        if(!options.hint){
            str += `<p id="hint" style="font-size:24px;font-weight:bold;margin-bottom: 10%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        请输入手势密码
                    </p>`.trim()
        } 

        container.innerHTML = str
        document.body.appendChild(container)

        let defaultOptions = {   
                customStyle: false,                                         //boolean   是否自定义样式
                checkBtn: document.querySelector('#testRadio'),                                  //
                updataBtn: document.querySelector('#setRadio'),
                hint: document.querySelector('#hint'),
                background: 'url("background2.jpeg")',                      //url    container背景
                textColor: '#fff',
                rightColor: '#8cf939',
                wrongColor: '#fb4920',
                canvasWidth: false,                                         //是否自定义canvas宽度
                chooseType: 3,
                render: true,                                               //自动渲染
                originR: 0.3,                                               //半径占圆心距的比例
                customFilledPicUrl: `./yellowMan/filledPic.png`,            //不用图片的选项?
                customFilledPicNumber: 19,
                minPoint: 5,
            }
        //创建实参和默参的并集
        this.options = Object.assign({}, defaultOptions, options)
        let {customStyle, textColor, background, render} = this.options

        if(render){
            if(!customStyle){
                Object.assign(container.style, {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    color: `${textColor}`,
                    background: `${background} center 0 no-repeat fixed`
                })
            }

            this.initData()
            this.addEvent()
        }
    },

    initData(){
        let {width, chooseType, originR} = this.options
            main = document.querySelector('#main'),
            lastLine = main.querySelector('#lastLine'),
            backRound = main.querySelector('#backRound'),
            width = width ? width: main.getBoundingClientRect().width

        this.canvas = main.querySelector('#canvas')

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
        this.computeCircle(chooseType, originR)                 //计算圆的分布,圆心坐标、半径分别存储在roundCenter和r中
        this.record = []                                        //当前按序走过的所有圆的序号   record: [5,6,3]

        drawHollowCircle(backRound.getContext('2d'), this.roundCenter, this.r)
    },
    
    //添加touch事件
    addEvent(){
        let _this = this,
            eventStatus = false,    //表示事件当前状态  在start前是false start后变为true  end够变为false
            timer = true,           //true表示当前可以进行touchmove回调函数，false则相反,
            filledPic = [],
            {ctx, lastLinectx, roundCenter, record, width, r, endCallback} = this,
            {customFilledPicUrl, customFilledPicNumber, minPoint} = this.options,
            urlBreakPoint = customFilledPicUrl.lastIndexOf('.'),
            picUrlTail = customFilledPicUrl.slice(urlBreakPoint),
            picUrlHand = customFilledPicUrl.slice(0, urlBreakPoint)
        
        computeFilledPic(filledPic, customFilledPicNumber)                  //初始化圆中图案序号
        
        //触发频率高，所以不需要start时验证
        this.canvas.addEventListener('touchstart', function(e){
            eventStatus = true
        })

        //测试当前位置数据并进行处理
        this.canvas.addEventListener('touchmove', function(e){
            if (eventStatus && timer) {
                let {clientX, clientY} = e.touches[0],
                    currentPoint = getCanvasPoint(this, clientX, clientY)
                
                //画圆心连线和绘制圆内图
                if(_this.testPosition(currentPoint)){
                    let len = record.length,
                        lastPoint = roundCenter[record[len - 1]],
                        beforeLastPoint = roundCenter[record[len - 2]]

                     if(record.length > 1){
                        drawLine(ctx, beforeLastPoint, lastPoint)
                     }
                     drawContent(ctx, lastPoint, picUrlHand + filledPic[record[len - 1]] + picUrlTail, r)
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
                _this.dealPassword(record)
                endCallback && endCallback()

                eventStatus = false
                record.length = 0
                resetDraw(lastLinectx, width)
                computeFilledPic(filledPic, customFilledPicNumber)

                //延迟重置画布，保留结果
                setTimeout(function(){
                    resetDraw(ctx, width)
                }, 300);
            }
        })
        this.canvas.addEventListener('touchmove', function(e){
            e.preventDefault();
        })
    },
})
}