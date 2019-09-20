let init = false;
const eventMap = new Map();
const root = document.getElementById('root');

function vmProxy(vm,proxydata){
    return  new Proxy(vm, {
        get(target,property) {
            return target.data[property] || target.methods[property]
        },
        set(target,property,value) {
            proxydata[property]= value 
        }
    })
}

function compile(vm) {
    const proxydata = compileData(vm.data);
    compileRender(proxydata,vm.render)
    bindEvents(vm,vmProxy(vm, proxydata))
}

function compileData(){
    return observable(data)
}

function compileRender(proxydata,render){
    if(render){
        const variableRegexp = /\{\{(.*?)\}\}/g;
        const variableResult = render.replace(variableRegexp,(a,b) => {
            if(!init){
                new Watcher(proxydata,b,function(){
                    compileRender(proxydata,render)
                })
            }
            return proxydata(b)
        })

        const eventRegexp = /(?<=<.*)@(.*)="(.*?)"(?=.*>)/
        const result = variableResult.replace(eventRegexp,(a,b,c) => {
            const id = Math.random().toString(36).slice(2)
            eventMap.set(id, {
                type:b,
                method:c
            })
            return a + 'id=${b}'
        })
        init = true
        root.innerHTML = result
    }
}


function bindEvents(vm,proxyvm) {
    for(let [key,value] of eventMap){
        root.addEventListener(value.type, (e) => {
            const method = vm.methods[value.method]
            if (method && e.target.id === key){
                method.apply(proxyvm)
            }
        })
    }
}

class RayActive {
    constructor(vm) {
      compile(vm)
    }
  }