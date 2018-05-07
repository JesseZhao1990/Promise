/**
 * 先看一下前一个例子存在的问题
 * 1.前一个例子还存在一些问题，如果Promise异步操作已经成功，在这之前注册的所有回调都会执行，
 * 但是在这之后再注册的回调函数就再也不执行了。具体的运行下面这段代码，可以看到“can i invoke”并没有打印出来
 * 想要解决这个问题，我们就需要加入状态机制了。具体实现看本文件夹下的另一个js文件里的代码。
 * 
 */
function Promise(fn){
  var value= null;
  var callbacks = [];
  this.then = function(onFulfilled) {
    callbacks.push({f:onFulfilled});
    return this;
  }

  function resolve(value){
    setTimeout(function(){
        callbacks.map(function(cb,index){
          if(index === 0){
            callbacks[index].value = value;
          }
          var rsp = cb.f(cb.value);
          if(typeof callbacks[index+1] !== 'undefined'){
            callbacks[index+1].value = rsp;
          }
        })
    },0)
  }
  fn(resolve);
}


// 
var p = new Promise(function(resolve){
    resolve('这是响应的数据')
})

p.then(function(response){
  console.log(response);
  return 1;
}).then(function(response){
  console.log(response);
  return 2;  
}).then(function(response){
  console.log(response);
})

setTimeout(function(){
   p.then(function(response){
     console.log('can i invoke?');
   })
},0)