const argsOrArray = (args) => (args.length === 1 && Array.isArray(args[0])) ? args[0] : args

const makePath = (strOrPath) => typeof strOrPath === 'string' ? strOrPath.split('.').map(x => isNaN(x) ? x : Number(x)) : strOrPath
const immutableSplice = (arr, start, deleteCount, ...items) =>  [ ...arr.slice(0, start), ...items, ...arr.slice(start + deleteCount) ]

const clone = (obj) => Object.assign({},obj)
const omit = (key,obj) => {
  const r = clone(obj)
  delete r[key]
  return r
}

const symbols = {
  RENAME: Symbol('RENAME'),
  DELETE: Symbol('DELETE')
}

const ops = {
  delete: ({[symbols.DELETE]:true}),
  renameTo: (key) => ({[symbols.RENAME]:key})
}

const applyUpdateAt = (path,fn,obj,parents=[]) => {
  if (path.length === 0) return typeof fn === 'function' ? fn(obj,...parents) : fn
  else {
    const key = path[0]
    const replacement = applyUpdateAt(path.slice(1),fn,obj && obj[key],[obj,...parents])
    const isDelete = replacement && replacement[symbols.DELETE]
    const renameTo = replacement && replacement[symbols.RENAME]
    const isRename = Boolean(renameTo)




    if (obj && (replacement === obj[key])) return obj

    if (Array.isArray(obj)){

      if (isNaN(key)){
        throw new Error(`Attempted to set a non-numeric key '${key}' in array ${parents.length && `${parents[0]}` }`)
      } else if (isRename){
        throw new Error("Attempted to rename an array key (${key} -> ${renameTo})")
      }else if (isDelete){
        return immutableSplice(obj,key,1)
      }else{
        return immutableSplice(obj,key,1,replacement)
      }

    }else if (isRename){

      if (obj && obj[key]){
        return omit(key,Object.assign({},obj,{[renameTo]:obj[key]}))
      }else{
        // don't modify
        return obj
      }

    }else if (isDelete){
      return omit(key,obj)
    }else{
      return Object.assign({},obj,{[key]:replacement})
    }

  }
}

const updateAt = (path,fn) => (obj) => {
  return applyUpdateAt(typeof path === "string" ? [path] : path,fn,obj)
}

const updates = (...fnsOrArray) => (obj) => argsOrArray(fnsOrArray).reduce((acc,cur) => {
  if (typeof cur !== 'function'){
    throw new Error('Received non-function in updates(...) call')
  }
  return cur(acc)
},obj)

const shapeToUpdates = (path,shape) => {
  if (typeof shape === 'object'){
    const listOfUpdates = []
    for (let key in shape){
      listOfUpdates.push(...shapeToUpdates([...path,key],shape[key]))
    }
    return listOfUpdates
  }
  return [updateAt(path,shape)]
}

const updateShape = (shape) => updates(shapeToUpdates([],shape))

module.exports = {
  makePath,
  updateAt,
  updates,
  updateShape,
  ops
}
