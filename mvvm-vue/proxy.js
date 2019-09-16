//观察函数
function observable(obj){
    const dep = new Dep();

    const proxy = new Proxy(obj,{
        get(target,property){
            const value = target[property]
            if(value && typeof value == 'object'){
                //递归处理对象
                target[property] = observable(value)
            }

            if(Dep.target){
                dep.addWatcher(Dep,target)
            }
            return target[property]
        },

        set(target,property,value){
            target[property] = value
            dep.notify()
        }
    })

    return proxy
}


//队列类
class Dep {
    constructor(){
        this.watchers = []
    }

    addWatcher(watcher){
        this.watchers.push(watcher)
    }

    notify(){
        this.watchers.forEach((watcher) => {
            watcher.update()
        })
    }
}

//监听类
class Watcher {
    constructor(proxy,property,cb) {
        this.proxy =  proxy;
        this.property = property;
        this.cb = cb;
        this.value = this.get()
    }

    update(){
        const newValue = this.proxy(this.property);
        if(newValue !== this.value && this.cb){
            this.cb(newValue)
        }
    }

    get(){
        Dep.target = this;
        const value = this.proxy[this.property];
        Dep.target = null
        return value
    }
}