// promise/promise A+规范
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function Promise(excutor){
    let that = this;
    that.status = PENDING;
    that.value = undefined;
    that.reason = undefined;
    that.onFulfilledCallbacks = [];
    that.onRejectedCallbacks = [];
    
    function resolve(value){
        if(value instanceof Promise) {
            return value.then(resolve,reject)
        }

        setTimeout(()=>{
            if(that.status === PENDING) {
                that.status = FULFILLED;
                that.value = value;
                that.onFulfilledCallbacks.forEach(cb => cb(that.value))
            }
        })
    }

    function reject(reason) {
        setTimeout(() => {
            if(that.status === PENDING){
                that.status = REJECTED;
                that.reason = reason;
                that.onRejectedCallbacks.forEach(cb => cb(that.reason))
            }
        })
    }

    try{
        excutor(resolve,reject)
    }catch(e){
        reject(e)
    }
}


/**
 * 对resolve 进行改造增强 针对resolve中不同值情况 进行处理
 * @param  {promise} promise2 promise1.then方法返回的新的promise对象
 * @param  {[type]} x         promise1中onFulfilled的返回值
 * @param  {[type]} resolve   promise2的resolve方法
 * @param  {[type]} reject    promise2的reject方法
 */
function reslovePromise(promise2,x,resolve,reject){
    if(promise2 === x){
        return reject(new TypeError('循环引用'))
    }

    let called = false

    if(x instanceof Promise){
        if(x.status === PENDING) {
            x.then(y => {
                reslovePromise(promise2,y,resolve,reject)
            },reason => {
                reject(reason)
            })
        }else{
            x.then(resolve,reject)
        }
    }else if(x !== null && ((typeof x === 'object') || (typeof x === 'function'))){
        try {
            let then = x.then;
            if(typeof then === 'function'){
                then.call(x,y => {
                    if(called){
                        return
                    }
                    called = true;
                    reslovePromise(promise2,y,resolve,reject)
                },reason => {
                    if(called){
                        return
                    }
                    called = true;
                    reject(reason)
                })
            }else {
                resolve(x)
            }
        }catch(e){
            if(called) return;
            called = true;
            reject(e);
        }
    }else{
        resolve(x)
    }
}

promise.prototype.then = function(onFulfilled, onRejected){
    const that = this;
    let newPromise;

    onFulfilled =
        typeof onFulfilled === "function" ? onFulfilled : value => value;
    onRejected =
        typeof onRejected === "function" ? onRejected : reason => {
            throw reason;
        };
    
    if(that.status === FULFILLED){
        return newPromise = new Promise((resolve,reject) => {
            setTimeout(() => {
                try{
                    let x = onFulfilled(that.value);
                    reslovePromise(newPromise,x,resolve,reject)
                }catch(e){
                    reject(e)
                }
            });
        })
    }

    if(that.status === REJECTED){
        return newPromise = new Promise((resolve,reject) => {
            setTimeout(() => {
                try{
                    let x = onRejected(that.reason);
                    reslovePromise(newPromise,x,resolve,reject)
                }catch(e){
                    reject(e)
                }
            });
        })
    }

    if(that.status === PENDING){
        return newPromise = new Promise((resolve,reject) => {
            that.onFulfilledCallbacks.push((value) => {
                try{
                    let x = onFulfilled(value);
                    reslovePromise(newPromise,x,resolve,reject)

                }catch(e){
                    reject(e)
                }
            })
            that.onRejectedCallbacks.push((reason) => {
                try {
                    let x = onRejected(reason);
                    resolvePromise(newPromise, x, resolve, reject);
                } catch(e) {
                    reject(e);
                }
            });
        })
    }
}

Promise.all = function(promise) {
    return new Promise((res,reject) => {
        let done = gen(promises.length, resolve);
        promises.forEach((promise, index) => {
            promise.then((value) => {
                done(index, value)
            }, reject)
        })
    })
}

function gen(length,resolve){
    let count = 0;
    let values = [];
    return function(i,value){
        values[i]= value;
        if(++count === length){
            resolve(values)
        }
    }
}

Promise.race = function(promises) {
    return new Promise((resolve, reject) => {
        promises.forEach((promise, index) => {
           promise.then(resolve, reject);
        });
    });
}

Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
}

Promise.resolve = function (value) {
    return new Promise(resolve => {
        resolve(value);
    });
}

Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
        reject(reason);
    });
}

Promise.deferred = function() { // 延迟对象
    let defer = {};
    defer.promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = reject;
    });
    return defer;
}


try {
    module.exports = Promise
  } catch (e) {
  }