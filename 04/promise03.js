/**
 * 刚才的例子中，确实打印出了 can i invoke，但是之前then的注册函数的返回值，并没有打印出来。
 * 也就是说 1 和 2 并没有被打印出来，看下面的注释
 * 
 */
function Promise(fn){
  var status = 'pending'
  var value= null;
  var callbacks = [];
  this.then = function(onFulfilled) {

    if(status === 'pending'){
      callbacks.push({f:onFulfilled});
      return this;
    }

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

var p = new Promise(function(resolve){
    resolve('aaaaaa')
})

p.then(function(response){
  console.log(response);    
  return 1;
}).then(function(response){
  console.log(response);  // 这里应该打印的是45行返回的1，但是打印出来的确是aaaaaa
  return 2;  
}).then(function(response){
  console.log(response); // 这里应该打印的是48行返回的2，但是打印出来的确是aaaaaa
})

setTimeout(function(){
   p.then(function(response){
     console.log('can i invoke?');
   })
},1000)


/**
 * 问题的根源在于什么呢？
 * 问题的根源是每次的then的返回值都是p，当状态是fulfilled，执行的是onFulfilled(value)
 * 此处的value是p的value，也就是fulfilled状态的value。根据规范，promise应该是只能发射单值。
 * 而我们设计了一个callback堆栈中有一系列的值。生生的把promise变成了多值发射。
 * 
 * 所以，调整思路，每个then都应该返回一个promise，这个promise应该是一个全新的promise。
 * 具体实现见下一个例子。
 */