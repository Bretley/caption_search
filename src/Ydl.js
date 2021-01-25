import ydl from 'youtube-dl'
import fs from 'fs'
import natural from 'natural'
import { reverse } from 'dns'
'use strict'

const stops = ['talk', 'that', 'anyway', 'anyways', 'let', 'lets', 'that', 'that\'s', 'people', 'go', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']
const options = {
  // Write automatic subtitle file (youtube only)
  output: '%(title).%(ext)s',
  auto: true,
  // Downloads all the available subtitles.
  all: false,
  // Subtitle format. YouTube generated subtitles
  // are available ttml or vtt
  format: 'vtt',
  // Languages of subtitles to download, separated by commas.
  lang: 'en',
  // The directory to save the downloaded files in.
  cwd: './subtitles_raw',
}

const maxMin = (arr) => {
    let max = arr[0]
    let min = arr[0]
    for (let i = 0; i < arr.length; i++) {
        max = arr[i] > max ? arr[i] : max
        min = arr[i] < min ? arr[i] : min
    }
    return [max, min]
}

let url = 'https://www.youtube.com/playlist?list=' + 'UU0YvoAYGgdOfySQSLcxtu1w'
let download_raw = () => {
    let x = ydl.exec(url, ['--flat-playlist',
                '--skip-download',
                '--dump-json'],
                {}, 
        (err, output) => {
            if (err) throw err;
            fs.writeFileSync('./info.json', JSON.stringify(
                output.map(x => JSON.parse(x))
            ))

            // download of files
            list = JSON.parse(fs.readFileSync('./info.json'))
            downloaded = fs.readdirSync('./subtitles_raw/')


            downloaded = downloaded.map(
                x => x.replace(/\%\(ext\)s.en.vtt/g, '')
                      .replace(/.en.vtt/g, ''))
            // filter list based off if urls are in titles in downloaded
            list = list.filter(x => !downloaded.some(y => y.includes(x.url)))
            console.log(`set to download ${list.length} caption files`)
            list.forEach(x => {
                ydl.getSubs(x.url, options, (err, files) => {
                    if (err) throw err
                    console.log('subtitle files downloaded:', files)
                })
            })
        })
        
}


let insert = (node, str, value, results) => {
    let [x, ...xs] = str
    if (node === undefined || x === undefined) {
        return
    }
    if (node.children[x] === undefined) {
        node.children[x] = {children: {}, weight: value, ends: false, results: null}
    } else {
        node.children[x].weight += value
    }

    if (xs.length === 0) {
        node.children[x].ends = true
        node.children[x].value = results
        return
    }
    insert(node.children[x], xs, value, results)
}

let create_trie = (counts, reverseIndex) => {
    let root = {
        value: null,
        children: {},
        weight: 0,
        ends: false,
    }
    counts = counts
        .map(({word, count}) => ({letters: word.split(''), count, results: reverseIndex[word]}))
    
    counts.forEach(({letters, count, results}) => 
        insert(root, letters, count, results)
    )
    
    return root
}

let parse_files = () => {
    let subtitlesDisk = fs.readdirSync('./subtitles_raw')
    let info = JSON.parse(fs.readFileSync('./info.json'))
    info = info.map(x => {
        // does the file with my url exist?
        let location = subtitlesDisk.find(y => y.includes(x.url) )
        return location !== undefined
            ? {...x, location}
            : undefined
    }).filter(x => x !== undefined)
    const fixed_names = info.map(x => x.title)
    const subtitle_names = info.map(x => x.location)

    let counts = []
    info.forEach((x, i) => {
        let title = fixed_names[i]
        let file = String(fs.readFileSync('.\\subtitles_raw\\' + x.location))
        // formatting of the actual vtt file
        file = file
            .replace(/\<c\>|\<\/c\>|\d\d:\d\d:\d\d\.\d\d\d \-\-\> .*|\<\d\d:\d\d:\d\d\.\d\d\d\>/g,'')
            .replace(/WEBVTT|Kind: captions|Language: en|,|\.|'/g, '')
            .replace(/-/g, ' ')
            .split('\n')
            .filter(x => x !== '\n' && x !== ' ' & x !== '')
        
        // duplication of lines thing for no reason
        // also add title to index search
        file = [...new Set(file), title.replace(/'|\.|,/g, '')]
            .reduce((acc, cur) => acc.concat(' ' + cur))
            .toLowerCase()
            .split(' ')
            .filter(x => !stops.includes(x))
            .map(x => natural.PorterStemmer.stem(x))

        let numWords = file.length
        let count = {}
        file.forEach(x => {
            count[x] = (count[x] || 0) + 1
        })
       
        counts = [...counts, [i, count, numWords]]
    })
    let reverse_index = {}
    counts.forEach(([title, count_map, numWords]) => {
        Object.entries(count_map).forEach(([word, count]) => {
            reverse_index[word] = [...(reverse_index[word] || []), {title, tf: count / numWords}]
        })
    })
    Object.entries(reverse_index).forEach(([word, results], i) => {
        results.sort((a,b) => 
            a.tf < b.tf ? 1
            : a.tf > b.tf ? -1
            : 0
        )
        reverse_index[word] = results.map(({title, tf}) => ([title, parseInt(tf.toFixed(4).replace('0.', ''))]))
    })
    /*
    let t = Object.values(reverse_index)
                .reduce((a,c) => a.concat(c), [])
                .map(x => x[1])
                .sort((a, b) => a - b)
    let t = Object.entries(reverse_index)
            .reduce((a,[t,c]) => [...a, [t,c.length]], [])
            .filter(([,c]) => c > info.length - 50)
    
    */

    // numeric compression; lossy*/
    console.log(info.length)
    let compTfArr = []
    Object.entries(reverse_index).forEach(([word, results]) => {
        results.forEach((res, i) => {
            let [, tf] = res
            let index = compTfArr.findIndex(x => x === tf)
            if (index === -1) {
                compTfArr.push(tf)
                reverse_index[word][i][1] = compTfArr.length - 1
            } else {
                reverse_index[word][i][1] = index
            }
        })
    })

    //compression of titles
    ///*
    //console.log(fixed_names)
    let uniqueTitles = [...new Set(
        fixed_names.reduce(
            (a,c) => a.concat(
                c.replace(/\.|,/g, '')
                .split(' ')
            )
        , [])
    )]

    //*/

    fs.writeFileSync('./reverse_index.json', 
        JSON.stringify({
            index: reverse_index,
            numDocs: info.length,
            titles: fixed_names.map(x => x.replace(/\./g, '')),
            urls: info.map(x => x.url),
            scores: compTfArr,
        })
    )
}

//download_raw()
parse_files()