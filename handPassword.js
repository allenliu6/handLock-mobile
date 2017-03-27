/*
    record: [5,6,3]    按序走过的所有圆的序号  
    lastPoint: {x, y}    = record[record.length - 1]    上一个经过的圆心坐标
    arr: []   存储九个初始化圆心坐标 
    控制touchmove事件触发次数
 */

'use strict'//移动端
window.touchLock = function({n = 3, width = 300, height = 300, endCallback} = {n:3, width:300, height:300}){//构造函数  个性化定制参数   几列组合type
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

       let arr = this.computeCircle(this.chooseType);//计算圆的分布
       this.arr = arr[0]   //存储九个初始化圆心坐标   arr: [{x: 65, y:65},{}]
       this.r = arr[1]     //存储初始圆半径           30
       this.lastPoint = {} //上一个经过的圆心坐标，即record的最后一个元素   lastPoint: {x, y}
       this.record = []    //当前按序走过的所有圆的序号   record: [5,6,3]
       this.testStep = 0   //验证情况，0表示没设置密码  1表示设置过一次密码需要再确认  2表示设置成功密码  同时赋值localStorage.handPassword  不成功则重新回到0
       this.tempRecord = []    //临时存储圆的序号，设置重复验证时，验证密码时暂存与localStorage的数据

       this.drawCircle()
       this.addEvent() 
    },
    initDom(){
        let content = document.createElement('div'),
            str = `<canvas id="canvas" width="${this.width}" height="${this.height}" style="margin-top: 20%;">
                    <p>Your browserdoes not support the canvas element.</p> 
                </canvas>
                <h2 id="title" style="margin-bottom: 10%;">请输入手势密码</h2>
                <form>
                    <input id="setRadio" name="type" type="radio" checked>设置密码<br>
                    <input id="testRadio" name="type" type="radio">验证密码
                </form>`

        content.setAttribute('style', 'position: absolute;left: 0;right: 0;top: 0;bottom: 0;background-color: #e7f9f9;text-align: center;')

        content.innerHTML = str
        document.body.appendChild(content)
    },
    // 创建解锁点的坐标，根据canvas的大小来平均分配半径   并遍历绘制出来
    computeCircle(){
        let n = this.chooseType,// 画出n*n的矩阵 
            arr = [],
            r = this.width / (2 + 4 * n);// 公式计算 半径和canvas的大小有关

        for (let i = 0 ; i < n ; i++) {
            for (let j = 0 ; j < n ; j++) {
                arr.push({
                    x: j * 4 * r + 3 * r,
                    y: i * 4 * r + 3 * r
                });
            }
        }

        return [arr, r];
    },
    drawCircle(){
        for (let val of this.arr) {
            this.ctx.fillStyle='#fff'
            this.ctx.strokeStyle = '#CFE6FF';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(val.x, val.y, this.r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
    },
    drawPoint(val){//使经过的圆心形成小圆  
        this.ctx.fillStyle='#CFE6FF'
        this.ctx.beginPath();
        this.ctx.arc(val.x, val.y, this.r/2, 0, Math.PI * 2);
        this.ctx.fill();
    },
    drawPicture(){//使经过的圆里面呈现图片

    },
    drawStatusPoint(color){//转换初始圆的颜色形成
        for (let val of this.record) {
            this.ctx.fillStyle='#fff'
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.arr[val].x, this.arr[val].y, this.r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.drawPoint(this.arr[val])
        }  
    },
    drawLine(begin, end){//在两个点之间连线
        this.ctx.beginPath();
        this.ctx.moveTo(begin.x, begin.y)
        this.ctx.lineTo(end.x, end.y)
        this.ctx.stroke()
    },
    resetDraw(){//重置画布
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.drawCircle()
    },
    //测试点是否在解锁点内并添加到数据存储record和lastPoint     4\5让动画更自然一些？？
    testPosition(x, y){
        for(let index of this.arr.keys()){
            if (Math.abs(x - this.arr[index].x) < this.r && Math.abs(y - this.arr[index].y) < this.r) {
                return index
            }
        }
    },
    updata(x, y){//每次touchmove渲染画布内容包括小圆以及连线
        let lastcircle;

        for(let index of this.record){
            if (this.arr[index]) {
                this.drawPoint(this.arr[index])

                if (lastcircle) {
                    this.drawLine(lastcircle, this.arr[index])
                    lastcircle = this.arr[index]
                }else{
                    lastcircle = this.arr[index]
                }
            }
        }

        this.drawLine(this.lastPoint, {x, y})//防止end事件触发太快将lastpoint清空
    },
    //设置时判断长度以及重复验证   step为2和0在设置时表现相同
    setPassword(){
        if(this.testStep === 1) {
            if (this.record.length !== this.tempRecord.length) {
                title.innerHTML = '两次输入不一致,请重新输入'
                this.drawStatusPoint('#f9968b')
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
                    this.drawStatusPoint('#aff193')
                    this.testStep = 2
                    window.localStorage.handPassword = this.tempRecord.join(' ')
                }else{
                    title.innerHTML = '两次输入不一致,请重新输入'
                    this.drawStatusPoint('#f9968b')
                    this.testStep = 0
                    this.tempRecord = []
                }
            }
        }
        else{
            title.innerHTML = '请再次输入手势密码'
            this.drawStatusPoint('#aff193')
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
            this.drawStatusPoint('#aff193')
        }else{
            title.innerHTML = '输入密码不正确'
            this.drawStatusPoint('#f9968b')
        }
    },
    dealPassword(){//验证输入是否符合当前规则，并分别进行处理
        let setRadio = document.getElementById('setRadio'),
            testRadio = document.getElementById('testRadio'),
            title = document.getElementById('title')

        if (setRadio.checked) {
            if (this.record.length < 5) {
                title.innerHTML = '密码太短，至少需要5个点'
                this.drawStatusPoint('#f9968b')
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
                this.drawStatusPoint('#f9968b')
                return
            }
            this.testPassword()
        }
    },
    addEvent(){//添加touch事件
        let _this = this
        this.canvas.addEventListener('touchstart', function(e){//测试当前位置数据并进行处理   触发频率高，所以不需要start时验证
            e.preventDefault();
        })
        this.canvas.addEventListener('touchmove', function(e){//测试当前位置数据并进行处理
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
                    _this.lastPoint = _this.arr[res]
                    _this.record.push(res)
                    _this.drawPoint(_this.lastPoint)
                }
            }

            _this.resetDraw()
            _this.updata(x, y)
        })
        this.canvas.addEventListener('touchend', function(e){
            _this.dealPassword()
            _this.record = []
            _this.lastPoint = {}
            _this.endCallback && _this.endCallback
            setTimeout(function(){
                _this.resetDraw()
            }, 300);
        })
        this.canvas.addEventListener('touchmove', function(e){
            e.preventDefault();
        })
    }
})