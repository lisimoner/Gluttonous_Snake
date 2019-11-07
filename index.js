
//蛇头蛇身以及苹果都是一个小方块，设置小方块的宽高为20*20，整个content是600*600，因此共有30行30列
var sw=20,   //一个小方块的宽度
	sh=20,   //一个小方块的高度
	tr=30,	 //行数  600/20=30
	td=30;	 //列数	 60020=30

var snake=null; //创建蛇的实例
var food=null;  //创建food的实例
var game=null;

//创建方块的构造函数
//x,y表示的是小方块的坐标
function Square(x,y,classname){
	//传入的x,y坐标是为右边的x,y个数坐标，内部的x,y坐标是需要换算成像素坐标
	//   px      x,y  左边的是小方块的像素坐标，右边的是小方块的个数坐标，两者之间需要进行换算
	//   0,0     0,0
	//   20,0    1,0
	//   40,0    2,0
	this.x=x*sw;
	this.y=y*sh;
	this.class=classname;   /*定义是蛇头还是蛇身或者是苹果*/

	this.viewContent=document.createElement('div');  //动态创建div
	this.viewContent.className=this.class;   //让div的class等于classname
	this.parent=document.getElementById('snakeWrap')  //定义父级div是属于哪个
}

//创建方块DOM
//实际上就是创建Squre对象的方法
Square.prototype.create=function(){
	this.viewContent.style.position='absolute';
	this.viewContent.style.width=sw+'px';
	this.viewContent.style.height=sh+'px';
	this.viewContent.style.left =this.x+'px';
	this.viewContent.style.top =this.y+'px';

	this.parent.appendChild(this.viewContent);  //将创建的DOM元素添加到父级div中
};

//移除DOM
Square.prototype.remove=function(){
	this.parent.removeChild(this.viewContent);
}

//蛇的创建
function Snake(){
	this.head=null;  //存蛇头的信息
	this.tail=null;  //存蛇尾的信息
	this.pos=[];  //存储蛇(蛇头蛇身和蛇尾)的每一个方块的位置，是一个二维数组

	//存储蛇走的方向
	this.directionNum={
		left:{
			x:-1,
			y:0,
			rotate:180, //蛇头在不同的方向中应该进行旋转，这是css3中的一个属性
		},
		right:{
			x:+1,
			y:0,
			rotate:0,
		},
		up:{
			x:0,
			y:-1,
			rotate:-90,
		},
		down:{
			x:0,
			y:+1,
			rotate:90,
		}
	}
}


//蛇的初始函数，在界面出面一条蛇头和两个蛇尾的蛇
Snake.prototype.init=function(){
	//需要创建蛇头蛇身
	var snakeHead=new Square(2,0,'snakeHead');  //蛇头的位置以及蛇头对应的html中的div
	snakeHead.create();
	this.head=snakeHead;  //存储蛇头信息
	this.pos.push([2,0]);  //把蛇头的位置存起来

	//创建蛇身1(从右往左)
	var snakeBody1=new Square(1,0,'snakeBody');
	snakeBody1.create();
	this.pos.push([1,0]);

	//创建蛇身2
	var snakeBody2=new Square(0,0,'snakeBody');
	snakeBody2.create();
	this.tail=snakeBody2; //把蛇尾的位置存起来
	this.pos.push([0,0]);

	//形成链表关系
	snakeHead.last=null;
	snakeHead.next=snakeBody1;

	snakeBody1.last=snakeHead;
	snakeBody1.next=snakeBody2;

	snakeBody2.last=snakeBody1;
	snakeBody2.next=null;

	//给蛇添加一条属性，用来表示蛇的方向
	this.direction=this.directionNum.right;  //蛇走的默认方向
}

//添加一个方法，用来获取蛇头的下一个位置对应的元素，根据元素做不同的事情
Snake.prototype.getNextPos=function(){
	var nextPos=[
	this.head.x/sw+this.direction.x,
	this.head.y/sh+this.direction.y
	];  //x,y的值

	//下个点出现的可能情况：代表怼到了自己，游戏结束
	var selfCollied=false;  //默认情况下是怼不到自己的
	this.pos.forEach(function(value){
	if(value[0]===nextPos[0] && value[1]===nextPos[1]){
			//若是下个点是pos数组中的一个点，就代表怼到了自己
			selfCollied=true;
	}
	});

	if(selfCollied){
		console.log('怼到自己了');
		//要使用call(this)是因为这时候的this并不是指向snake,而是指向this.strategies
		this.strategies.die.call(this);  
		return;   //阻止函数继续往下执行
	}

	//下个点是围墙，游戏结束
	if(nextPos[0]<0 || nextPos[1]<0 || nextPos[0]>td-1 || nextPos[1]>tr-1){
		console.log('怼墙上了');
		this.strategies.die.call(this);
		return;
	}

	//下个点是苹果
	if(food && food.pos[0]==nextPos[0] && food.pos[1]==nextPos[1]){
		//如果相等就吃
		this.strategies.eat.call(this);
	}
	

	//下个点啥都不是，走你
	this.strategies.move.call(this);
	
};


//处理蛇怼了后要做的事情
Snake.prototype.strategies={
	move:function(format){    //format用于决定是否删除最后一个方块(即蛇尾，若是吃就不删，若是走就删)，有传参数就是吃，没参数就是走
		//console.log('move');
		//console.log(this);  //如果没有上面的call(this)，那么这里的this将指向this.strategies，而不是snake，move函数中需要的是snake实体
		//创建一个newSnakeBody，位置在蛇头位置
		var newBody=new Square(this.head.x/sw,this.head.y/sh,'snakeBody');

		this.head.remove();  //删除旧的蛇头
		newBody.create();    //创建新的蛇身到蛇头位置

		//插入新的蛇身取代蛇头的位置
		newBody.next=this.head.next;  //也就是body1的位置
		newBody.next.last=newBody;
		newBody.last=null;

		//创建一个新的蛇头,位置就是nextPos的位置,根据nextPos的位置来判断游戏是否结束
		var newHead=new Square(this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y,'snakeHead');
		//更新链表关系
		newHead.next=newBody;
		newHead.last=null;
		newBody.last=newHead;
		newHead.viewContent.style.transform=`rotate(${this.direction.rotate}deg)`;
		newHead.create();

		//蛇身体的pso数组更新
		//this.unshift([this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y]);
		this.pos.splice(0,0,[this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y]); 
		this.head=newHead;  //蛇头也要更新

		

		//删除蛇尾
		if(!format){
			this.tail.remove();
			//更新链表
			this.tail=this.tail.last;
			this.pos.pop();  //数组更新
		}

	},
	eat:function(){
		//console.log('eat');
		this.strategies.move.call(this,true);   //很有道理
		createFood();
		game.score++;
	},
	die:function(){
		//console.log('die');
		game.over();
	}
}

snake=new Snake();



//创建食物
function createFood(){
	var x=null;
	var y=null;   //食物的随机坐标

	var  include=true;  //循环跳出的条件,true表示随机生成的食物出现在蛇身上，那就需要继续循环，false表示不在蛇身，生成食物后，跳出循环
	while(include){
		x=Math.round(Math.random()*(td-1));
		y=Math.round(Math.random()*(tr-1));

		snake.pos.forEach(function(value){
			if(x!=value[0] && y!=value[1]){
				//这个条件成立说明这个随机出现的坐标并不在蛇身上，所以可以用来生成食物，跳出循环
				include=false;
			}
		})
	}
	//生成食物
	food=new Square(x,y,'food');
	food.pos=[x,y];  //用于比较是否与蛇头坐标相等

	//判断是否有foof存在，若有，则被吃之后改变食物的样式来体现食物位置的变化，若没有就创建一个food
	var foodDom=document.querySelector('.food');
	//console.log(foodDom);
	if(foodDom){
		foodDom.style.left=x*sw+'px';
		foodDom.style.top=y*sh+'px';
	}else{
		food.create();
	}
}



//创建游戏操作
function Game(){
	this.timer=null;
	this.score=0;
}
Game.prototype.init=function(){
	snake.init();
	createFood();

	document.onkeydown=function(event){
		if(event.which==37 && snake.direction!=snake.directionNum.right){ //往右走的时候按左键无法向左走
			snake.direction=snake.directionNum.left;
		}else if(event.which==38 && snake.direction!=snake.directionNum.down){
			snake.direction=snake.directionNum.up;
		}else if(event.which==39 && snake.direction!=snake.directionNum.rght){
			snake.direction=snake.directionNum.right;
		}else if(event.which==40 && snake.direction!=snake.directionNum.up){
			snake.direction=snake.directionNum.down;
		}
	}

	this.start();
}
Game.prototype.start=function(){
	this.timer=setInterval(function(){
		snake.getNextPos();
	},200)
}
Game.prototype.pause=function(){
	clearInterval(this.timer);
}
Game.prototype.over=function(){
	clearInterval(this.timer);
	alert('得分：'+this.score);
	//回到游戏的初始状态
	var snakeWrap=document.getElementById('snakeWrap');
	snakeWrap.innerHTML='';
	snake=new Snake();
	game=new Game();
	var startBtnWrap=document.querySelector('.startBtn button');
	startBtnWrap.parentNode.style.display='block';
}

//开始游戏
game=new Game();
var startBtn=document.querySelector('.startBtn button');
startBtn.onclick=function(){
	startBtn.parentNode.style.display='none';
	game.init();
}
//暂停游戏
var startWrap=document.getElementById('snakeWrap');
var pauseBtn=document.querySelector('.pauseBtn button');
snakeWrap.onclick=function(){
	game.pause();
	pauseBtn.parentNode.style.display='block';
}
pauseBtn.onclick=function(){
	game.start();
	pauseBtn.parentNode.style.display='none';
}