/**
 * 1. 思考一下，如果在使用者在then的注册函数中返回的是一个promise，那下一个then的注册函数就应该是新的promise的注册函数。
 * 这个如何实现？
 * 
 */
function Promise(fn){
  var status = 'pending'
  var value= null;
  var callbacks = [];
  this.then = function(onFulfilled) {
    // 如果是pending状态，则加入到注册队列中去。
    if(status === 'pending'){
      callbacks.push({f:onFulfilled});
      return this;
    }
    // 如果是fulfilled 状态，此时直接执行传入的注册函数即可。
    onFulfilled(value);
    return this;
  }

  function resolve(newValue){
    value = newValue;
    status = 'fulfilled';
    setTimeout(function(){
        callbacks.map(function(cb,index){
          if(index === 0){
            callbacks[index].value = newValue;
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