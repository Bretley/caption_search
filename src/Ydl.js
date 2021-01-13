const ydl = require('youtube-dl')
const fs = require('fs')
const natural = require('natural')
const { getSubs } = require('youtube-dl')

'use strict'

const stops = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']
const options = {
  // Write automatic subtitle file (youtube only)
  output: '%(title).%(ext)s',
  auto: true,
  // Downloads all the available subtitles.
  all: false,
  // Subtitle format. YouTube generated subtitles
  // are available ttml or vtt.
  format: 'vtt',
  // Languages of subtitles to download, separated by commas.
  lang: 'en',
  // The directory to save the downloaded files in.
  cwd: './subtitles_raw',
}

url = 'https://www.youtube.com/playlist?list=' + 'UU0YvoAYGgdOfySQSLcxtu1w'
download_raw = () => {
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
            list.forEach(x => {
                ydl.getSubs(x.url, options, (err, files) => {
                    if (err) throw err
                    console.log('subtitle files downloaded:', files)
                })
            })
        })
        
}


insert = (node, str, value) => {
    let [x, ...xs] = str
    if (node === undefined || x === undefined) {
        return
    }
    if (node.children[x] === undefined) {
        node.children[x] = {children: {}, weight: value, ends: false}
    } else {
        node.children[x].weight += value
    }

    if (xs.length === 0) {
        node.children[x].ends = true
        return
    }
    insert(node.children[x], xs, value)
}

create_trie = (counts) => {
    let root = {
        value: null,
        children: {},
        weight: 0,
        ends: false,
    }
    counts = counts
        .map(({word, count}) => ({letters: word.split(''), count}))
    
    counts.forEach(({letters, count}) => 
        insert(root, letters, count)
    )
    
    return root
}

parse_files = () => {
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
        let file = String(fs.readFileSync('.\\subtitles_raw\\' + x.location))
        // formatting of the actual vtt file
        file = file
            .replace(/\<c\>|\<\/c\>|\d\d:\d\d:\d\d\.\d\d\d \-\-\> .*|\<\d\d:\d\d:\d\d\.\d\d\d\>/g,'')
            .replace(/WEBVTT|Kind: captions|Language: en|,|\.|'/g, '')
            .replace(/-/g, ' ')
            .split('\n')
            .filter(x => x !== '\n' && x !== ' ' & x !== '')
        
        // duplication of lines thing for no fucking reason
        file = [...new Set(file)]
            .reduce((acc, cur) => acc.concat(' ' + cur))
            .toLowerCase()
            .split(' ')
            .filter(x => !stops.includes(x))
            .map(x => natural.PorterStemmer.stem(x))

        let count = {}
        file.forEach(x => {
            count[x] = (count[x] || 0) + 1
        })
       
        counts = [...counts, [info[i].title, count, info[i].url]]
    })
    let reverse_index = {}
    counts.forEach(([title, count_map, url]) => {
        Object.entries(count_map).forEach(([word, count]) => {
            console.log(url)
            reverse_index[word] = [...(reverse_index[word] || []), {title, count, url}]
            console.log(reverse_index[word])
        })
    })
    Object.entries(reverse_index).forEach(([word, results]) => {
        results.sort((a,b) => 
            a.count < b.count ? 1
            : a.count > b.count ? -1
            : 0
        )
    })
    let globalCount = []
    Object.entries(reverse_index).forEach(([word, hits]) => {
    globalCount.push({
        word,
        count: hits.reduce((a,c) => a + c.count, 0)})
    })
    globalCount.sort((a,b) => 
        a.count > b.count ? -1 : 
        a.count < b.count ? 1 :
        0)
    
    const autoComplete = create_trie(globalCount)
    fs.writeFileSync('./reverse_index.json', JSON.stringify(
        {
            search: reverse_index,
            globalCount: globalCount,
            autoComplete
        }))
}

download_raw()
parse_files()