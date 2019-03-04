/**
 * 串行的Promise
 * 1.then方法会返回一个新的promise
 * 2.串行Promise是指在当前promise达到fulfilled状态后，即开始进行下一个promise
 */


// 首先我们来实现then方法返回一个新的promise，我们只需要在then方法中返回一个新的promise即可
function MyPromise(fn){
  var value= null;
  var status = 'pending';  
  var deferreds = [];
  this.then = function(onFulfilled) {

    // 我们只需要在此处返回一个新的promise即可。but返回的promise和当前promise中的注册函数需要建立什么关系？
    // 来看一下我们如何将返回的promise和当前的promise捆绑在一起的
    return new MyPromise(resolve=>{
      if(status === 'pending'){ 
        deferreds.push({   // 我们将当前promise的回调函数（onFulfilled）和 返回的新promise的resolve绑在一起，扔到当前deferreds的队列中
          onFulfilled:onFulfilled,
          resolve:resolve
        });
      }else{
        var res = onFulfilled(value);
        resolve(res);
      }
    }) 
    
  }

  function resolve(v){
    setTimeout(function(){
      value = v;
      status = 'fulfilled'  
      deferreds.forEach(function(deferred){
        // 当回调函数触发的时候，我们得到回调函数的返回值，并调用绑定的下一个promise的resolve方法
        // 此时完成了当前promise达到fulfilled状态后，即开始进行下一个promise的功能
        var res = deferred.onFulfilled(value);  
        deferred.resolve(res);
      })
    },0)
  }

  fn(resolve);
}

// 下面我们写段代码验证一下
var p1 = new MyPromise(resolve=>{
  setTimeout(()=>{resolve('1')},2000)
})
p1.then((res)=>{
  console.log(res);
  return '2';
}).then((res)=>{
  console.log(res);
}).then(()=>{
  console.log('3');
})

// 完美，我们依次打印出了1，2，3。但是我们还剩一个问题没有解决。就是在then的回调函数中，返回值有可能是个promise，
// 如果then的回调函数的返回值是个promise，那then返回的promise的内部value就应该是then的回调函数返回的promise的内部值
// 我们应该怎么做呢。其实，很简单，我们从resolve方法做手脚，上边的例子我们已经实现了回调函数的返回值，会传给下一个promise的resolve方法。
// 我们在resolve中判断接受到的值是一个普通的值，还是一个promise。如果不是promise，逻辑保持不变。如果是promise，则我们调用这个promise的then方法
// 通过调用这个promise的then方法，把当前的resolve变成这个promise的回调函数。

function MyPromise(fn){
  var value= null;
  var status = 'pending';  
  var deferreds = [];
  this.then = function(onFulfilled) {
    return new MyPromise(resolve=>{
      if(status === 'pending'){ 
        deferreds.push({   
          onFulfilled:onFulfilled,
          resolve:resolve
        });
      }else{
        var res = onFulfilled(value);
        resolve(res);
      }
    }) 
    
  }

  function resolve(v){
    setTimeout(function(){
      if (v instanceof MyPromise){
        v.then(resolve);   // 如果v是一个promise，那就会等待v这个promise成完成态的时候，再次触发当前promise的resolve方法。
      }else{
        value = v;
        status = 'fulfilled'  
        deferreds.forEach(function(deferred){
          var res = deferred.onFulfilled(value);  
          deferred.resolve(res);
        })
      }
    },0)
  }

  fn(resolve);
}


// 实验成果的时候到了。我们看看下面这段代码的输出
var p1 = new MyPromise(resolve=>{
  setTimeout(()=>{resolve('1')},2000)
})
p1.then((res)=>{
  console.log(res);
  return new MyPromise(resolve=>{setTimeout(()=>resolve('2'),3000)})
}).then((res)=>{
  console.log(res);
}).then(()=>{
  console.log('3');
})

// 如我们预期的那样，两秒之后输出1，然后再过三秒输出2，之后输出3