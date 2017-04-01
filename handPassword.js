//控制touchmove事件触发次数   经过一些测试，暂时定为40ms一次
//lastPoint  初始化
//大量使用es6,需要浏览器支持度较高
//endcallback   优雅弹窗


'use strict'//移动端
window.touchLock = function({n = 3, width = document.documentElement.clientWidth * 0.8, height = document.documentElement.clientWidth * 0.8, endCallback} = {n:3, width:document.documentElement.clientWidth * 0.8, height:document.documentElement.clientWidth * 0.8}){//构造函数  个性化定制参数   几列组合type
    this.chooseType = n
    this.width = width
    this.height = height
    this.endCallback = endCallback
}

Object.assign(touchLock.prototype, {
    init(){
       this.initDom()
       this.canvas = document.getElementById('canvas');
       this.ctx = canvas.getContext('2d');

       //数据初始化
       let arr = this.computeCircle(this.chooseType);//计算圆的分布  返回圆坐标数组和半径
       this.arr = arr[0]   //存储九个初始化圆心坐标   arr: [{x: 65, y:65},{}]
       this.r = arr[1]     //存储初始圆半径           30
       this.lastPoint = undefined //????如何初始化     上一个经过的圆心序号，即record的最后一个元素的序号
       this.record = []    //当前按序走过的所有圆的序号   record: [5,6,3]
       this.testStep = 0   //验证情况，0表示没设置密码  1表示设置过一次密码需要再确认  2表示设置成功密码  同时赋值localStorage.handPassword  不成功则重新回到0
       this.tempRecord = []    //临时存储圆的序号，设置重复验证时，验证密码时暂存与localStorage的数据
       this.timer = true   //true表示当前可以进行touchmove回调函数，false则相反
       this.yellowMan = []
       this.computeYellowMan()
       this.eventStatus   //表示事件当前状态  在start前是false start后变为true  end够变为false

        //页面初始化
       this.drawCircle()
       this.addEvent()
    },
    initDom(){
        let content = document.createElement('div'),
            str = `<canvas id="canvas" width="${this.width}" height="${this.height}" style="margin-top: 15%;">
                    <p>Your browser does not support the canvas element.</p> 
                </canvas>
                <h2 id="title" style="margin-bottom: 10%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    请输入手势密码
                </h2>
                <form style="font-size:20px;">
                    <input id="setRadio" name="type" type="radio" checked>设置密码<br>
                    <input id="testRadio" name="type" type="radio">验证密码
                </form>`

        content.setAttribute('style', `position: absolute;left: 0;right: 0;top: 0;bottom: 0;text-align: center;
            color: #fff;
            background-image:url("background2.jpeg"); background-position: center 0;
            background-repeat: no-repeat; background-attachment:fixed; background-size: cover;`)

        content.innerHTML = str
        document.body.appendChild(content)
    },
    // 创建解锁点的坐标，根据canvas的大小来平均分配半径   并遍历绘制出来
    computeCircle(){
        let n = this.chooseType,// 画出n*n的矩阵 
            arr = [],
            r = this.width / (4 * n - 1);// 公式计算 半径和canvas的大小有关

        for (let i = 0 ; i < n ; i++) {
            for (let j = 0 ; j < n ; j++) {
                arr.push({
                    x: j * 4 * r + 1.5 * r,
                    y: i * 4 * r + 1.5 * r
                });
            }
        }

        return [arr, r];
    },
    computeYellowMan(){//初始化小黄人的序号
        let s = new Set()
        while(s.size !== 9){
            s.add(Math.ceil(Math.random() * 19))
        }
        this.yellowMan = [...s]
    },
    drawCircle(){//将大圆绘制出来
        for (let val of this.arr) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(val.x, val.y, this.r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    },
    //@Params当前圆的次序  使经过的圆里面呈现图片  每次固定都是一张图片但需要不断刷新
    drawContainer(index){
        // 使经过的圆心形成小圆
        // this.ctx.fillStyle='#CFE6FF'
        // this.ctx.beginPath();
        // this.ctx.arc(val.x, val.y, this.r/2, 0, Math.PI * 2);
        // this.ctx.fill();
        let pic = new Image(),
            val = this.arr[index]; 

        pic.src =`./yellowMan/${this.yellowMan[index]}.png`;  
        this.ctx.drawImage(pic, val.x-this.r*2/3, val.y-this.r*2/3, this.r*1.5, this.r*1.5);  
    },
    drawStatusPoint(color){//@Params颜色字符串转换初始圆的颜色形成并启动画小圆函数   
        for (let index of this.record) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.arr[index].x, this.arr[index].y, this.r, 0, Math.PI * 2);
            this.ctx.stroke();
            this.drawContainer(index)
        }  
    },
    drawLine(begin, end){//@Params起始点和重点坐标对象  在两个点之间连线
        this.ctx.beginPath();
        this.ctx.moveTo(begin.x, begin.y)
        this.ctx.lineTo(end.x, end.y)
        this.ctx.stroke()
    },
    resetDraw(){//重置画布
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.drawCircle()
    },
    testPosition(x, y){//@Params鼠标坐标值  测试点是否在解锁点内   4\5让动画更自然一些？？
        for(let index of this.arr.keys()){
            if (Math.abs(x - this.arr[index].x) < this.r && Math.abs(y - this.arr[index].y) < this.r) {
                return index
            }
        }
    },
    updata(x, y){//@Params当前鼠标坐标数值  每次touchmove渲染画布内容包括小圆以及连线
        let lastcircle;

        for(let index of this.record){
            if (this.arr[index]) {
                this.drawContainer(index)

                if (lastcircle) {
                    this.drawLine(lastcircle, this.arr[index])
                    lastcircle = this.arr[index]
                }else{
                    lastcircle = this.arr[index]
                }
            }
        }

        this.drawLine(this.arr[this.lastPoint], {x, y})
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
    dealPassword(){//验证输入是否符合当前规则，并分别进行处理
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
    addEvent(){//添加touch事件
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
                        y = e.touches[0].clientY - rect.top,
                        res = _this.testPosition(x, y),
                        flag = true;

                    if(typeof res === 'number'){
                        for(let i of _this.record){
                            if (i === res) {
                                flag = false
                            }
                        }
                        if (flag) {
                            _this.lastPoint = res
                            _this.record.push(res)
                            _this.drawContainer(_this.lastPoint)
                        }
                    }

                    _this.resetDraw()
                    _this.updata(x, y)
                    _this.timer = false

                    setTimeout(function(){
                        _this.timer = true
                    },40)
                }else{
                    return 
                }
            }
        })

        this.canvas.addEventListener('touchend', function(e){
            if (_this.eventStatus) {
                _this.eventStatus = false
                _this.dealPassword()
                _this.record = []
                _this.lastPoint = undefined
                _this.endCallback && _this.endCallback()
                _this.computeYellowMan()

                setTimeout(function(){
                    _this.resetDraw()
                }, 300);
            }
        })
        this.canvas.addEventListener('touchmove', function(e){
            e.preventDefault();
        })
    }
})