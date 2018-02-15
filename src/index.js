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

const updateAt = (path,fn) => {
  const arrPath = Array.isArray(path) ? path : [path]
  return (obj) => applyUpdateAt(arrPath,fn,obj)
}

const updateShallow = (shape) => updates(Object.keys(shape).map(k => updateAt(k,shape[k])))
const updateList = (listOfFns) => {
  // Pre-check for misuse
  listOfFns.forEach(f => {
    if (typeof f !== 'function'){
      throw new Error('Received non-function in updates(...) call. (You provided a list of transform functions, but one of those transforms was not a function). I saw ' + f)
    }
  })
  return (obj) => listOfFns.reduce((acc,cur) => cur(acc),obj)
}


const updates = (...fnsOrArrayOrObject) => {
  return Array.isArray(fnsOrArrayOrObject[0])
    ? updateList(fnsOrArrayOrObject[0])
    : typeof fnsOrArrayOrObject[0] === 'object'
      ? updateShallow(fnsOrArrayOrObject[0])
      : updateList(fnsOrArrayOrObject)
}


// THIS SHOULD REALLY BE USED SPARINGLY.
// Using updates({ some: value, other: value, netsted: updates({ a:1, b:2  }) }) seems preferable in _most_ scenarios
// Mostly because you need to remember to lift values if you intend them to be treated as values, not further nested updates!
/* Consider:
  const newUser = getUserFromSomewhere('123')
  const newDatabase = updateDeep({
    entities:{
      users:{
        ['123']:newUser // Watch out!
      }
    }
  })(database)
*/
// A casual eye would lead you to expect this replaces database.entities.users['123'] with newUser - but it does not:
// Since updateDeep is recursive, `newUser` describes the tree of deeper updates.
// So newUser would be _merged_ into whatever is already in database.entities.users['123']
// The alternative is to _lift_ newUser, such that the leaf level update becomes () => newUser, but this still requires the
// developer to be aware of this caveat.
const updateDeep = (patternOrValue,parents=[]) => {
  if (typeof patternOrValue === 'object'){
    return updates(Object.keys(patternOrValue).map(
      k => updateAt(k,updateDeep(patternOrValue[k]))
    ))
  }else{
    return updateAt([],patternOrValue)
  }
}

const map = (fn) => (arr) => arr.map(fn)

module.exports = {
  makePath,
  updateAt,
  updates,
  updateDeep,
  // Deprecated
  updateShape:updateDeep,
  map,
  ops
}
