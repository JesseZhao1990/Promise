/**
 * 在promise01.js中，我们已经分析了，我们需要加入状态机制
 * 在这里实现一下PromiseA+中关于状态的规范。
 * 
 * Promises/A+规范中的2.1Promise States中明确规定了，pending可以转化为fulfilled或rejected并且只能转化一次，
 * 也就是说如果pending转化到fulfilled状态，那么就不能再转化到rejected。
 * 并且fulfilled和rejected状态只能由pending转化而来，两者之间不能互相转换
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