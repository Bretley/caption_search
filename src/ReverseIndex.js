const stem = require('natural').PorterStemmer.stem


const sum = (arr) => {
    let ret = 0
    for (let i = 0; i < arr.length; i++) {
        ret += arr[i]
    }
    return ret
}

class ReverseIndex {
  constructor(data) {
    Object.assign(this, data)
  }
        
  search = (queryText, numResults = -1) => {
    const {index, numDocs, titles, urls} = this
    let results = [...new Set(queryText.replace(/'/g, '').split(' '))]
      .map(x => index[stem(x)])
      .map(x => x === undefined ? [] : x)

    let agg = {}
    results.forEach(res => {
      let idf = Math.log(numDocs / res.length)
      res.forEach(([index, tf]) => {
        // append to vector in case of other scoring mechanism
        agg[index] = [...(agg?.[index] || []), tf*idf]
      })
    })

    // reduce / summarize
    let final = Object.entries(agg)
      .map(([i, score]) =>
        ({title: titles[i], score: sum(score), url: urls[i]})
      ).sort((a,b) => b.score - a.score)

    return final.slice(0, numResults)
  }
}

export default ReverseIndex