var express = require('express'),
    app = express(),
    router = express.Router(),
    https = require('https'),
    md = require('markdown-it')({html: true}),
    url = require('url'),
    owner = 'zhongweizhao',
    repo = 'github-api-test',
    uwAPIKey = '5edb44d933a5d6262bc77b8375ae0a3d'

/**
 * getCoursesListPromise
 * get the JSON of the files and directory in the repository define at the top of the file
 **/
function getCoursesListPromise(){
    return new Promise(function(resolve, reject) {
        var options = {
            host: 'api.github.com',
            path: '/repos/' + owner + '/' + repo + '/contents/',
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }

        var body = ''
        var request = https.request(options, function(response){
            console.log('getCoursesListPromise')
            console.log('statusCode:', response.statusCode)
            console.log('' + response.headers['content-type'])

            response.on('data', function(d){
                body += d.toString('utf8')
            })

            response.on('end', function(){
                console.log('Close reveived!\n')
                resolve(body)
            })
        })

        request.on('error', function(e){
            reject(Error('problem with request: ' + e.message))
        })

        request.end()
    })
}

/**
 * downloadNoteAsync
 * download
 **/
function downloadNoteAsync(path) {
    return new Promise(function(resolve, reject) {
        var options = {
            host: 'raw.githubusercontent.com',
            path: path,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }

        console.log('|\tDownloading from ' + options.path)

        var request = https.request(options, function(response){
            console.log('|\tstatusCode:', response.statusCode)
            console.log('|\t' + response.headers['content-type'])

            var data = ''

            response.on('data', function(d) {
                data += d.toString('utf8')
            })

            response.on('end', function(){
                console.log('|\tReceived!')
                data += '\n'
                resolve(data)
            })
        })

        request.on('error', function(e){
            reject(Error('Problem with request: ' + e.message))
        })
    })
}

/**
 * downloadNotesAsync
 * takes an array of paths
 * return a Promise that download all the notes in the list
 **/
function downloadNotesAsync(noteFilesPathList) {
    return new Promise(function(resolve, reject){
        notePromises = noteFilesPathList.map(function(path){return downloadNoteAsync(path)})

        data = ""
        Promise.all(notePromises).then(function(allData){
            data = allData.join('\n')
        }, function(error){
            console.log(Error(error))
        })
        resolve(data)
    })
}


function getNotesListOfACoursePromise(coursesCode){
    return new Promise(function(resolve, reject){
        var options = {
            host: 'api.github.com',
            path: '/repos/' + owner + '/' + repo + '/contents/' + courseCode,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }

        var body = ''
        var request = https.request(options, function(response){
            console.log('getNotesListOfACoursePromise')
            console.log('statusCode:', response.statusCode)
            console.log(response.headers['content-type'])

            response.on('data', function(d){
                body += d.toString('utf8')
            })

            response.on('end', function(){
                console.log('Close reveived!\n')
                noteFilesList = JSON.parse(body)

                noteFilesPathList = noteFilesLista.map(function(entry){
                    return url.parse(entry.download_url).pathname
                })

                if (response.statusCode == 200){
                    console.log('|Start download notes.\n')
                    downloadNotesAsync(noteFilesList).then(resolve, reject)
                } else {
                    var console_message = 'Fail to find notes\n'
                    console.log(console_message)
                    var message = '`Fail to fetch notes`'
                    reject(Error(message))
                }
            })
        })
        request.on('error', function(e){
            reject(Error('problem with request: ' + e.message))
        })
        request.end()
    })
}

function getCourseTitlePromise(subject, catalog_number){
    return new Promise(function(resolve, reject){
        var options = {
            host: 'api.uwaterloo.ca',
            path: '/v2/courses/' + subject + '/' + catalog_number + '.json?key=' + uwAPIKey,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }

        var body = ''
        var request = https.request(options, function(response){
            console.log('Fetch course title: ')
            console.log('|\tstatusCode:', response.statusCode)
            console.log('|\t' + response.headers['content-type'])

            response.on('data', function(d){
                body += d.toString('utf8')
            })

            response.on('end', function(){
                console.log('|\tReveived!')
                if (response.statusCode == 200){
                    console.log('|\tRequest success')
                    data = JSON.parse(body)
                    if (data.meta.status == 200) {
                        console.log('|\tCourse title get')
                        Title = data.data.title
                        resolve(Title)
                    } else {
                        console.log('|\tCourse title failed to get')
                        reject(Error('Failed to get course title'))
                    }
                } else {
                    console.log('|\tRequest failed')
                }
            })
        })

        request.on('error', function(e){
            console.log('problem with request: ' + e.message)
            reject(Error('problem with request: ' + e.message))
        })

        request.end()
    })
}

function getCoursesTitlePromise(coursesList) {
    return new Promise(function(resolve, reject){
        coursePromises = coursesList.map(function(entry){
            return getCourseTitlePromise(entry.subject, entry.catalog_number)
        })

        var n = 0
        Promise.all(coursePromises).then(function(data){
            for (var i=0;i<coursesList.length; i++){
                coursesList[i].title = data[i]
            }
            resolve(coursesList)
        }, function(error){
            reject(Error(error))
        })
    })
}



/*

Escape HTML characters in the LaTeX parts in the markdown code
say, "<" or ">" in LaTeX code, which will affect markdown being successfully rendered.

Also the new line "\\" in LaTeX, which will be treated as escaped backslash and rendered as "\"
So the backslash symbol also need to be escaped.

*/
function escapeLaTeX(input) {
    function escapeChar(c) {
        switch (c) {
            case '&': return '&amp;'
            case '<': return '&lt;'
            case '>': return '&gt;'
            case '"': return '&quot;'
            case "\\": return '&#92;'
            case "'": return '&#39;'
            default: return c
        }
    }

    var temp = new Array(),
    count = 0
    for(i = 0; i <input.length; i++){
        temp[i]= 0;
    }
    for(i = 0; i <input.length; i++){
        if(input.charAt(i)=='$'){
            temp[i]=1;
        }
    }

    for (i = 1; i <temp.length; i++){
        if(temp[i-1]==1&&temp[i]==0){
            temp[i]=2;
        }else if(temp[i-1]==2 && temp[i]==0){
            temp[i]=2;
        }else if(temp[i-1]==2 && temp[i]==1){
            temp[i]=3;
            count--;
        }else if(count>=0&&temp[i-1]==3 && temp[i]==1){
            temp[i]=3;
            count--;
        }else if(temp[i]!=0){
            count++;
        }
    }

    var result = ''
    for (i = 0; i<input.length; i++) {
        if (temp[i] == 2) {
            result += escapeChar(input.substr(i, 1))
        } else {
            result += input.substr(i,1)
        }
    }

    return result

}



router.get('/', function(req, res){

    getCoursesListPromise().then(function(data){
        var info = ''
        notesListData = JSON.parse(data)

        var coursesList = []

        for (i = 0; i < notesListData.length; i++) {
            if (notesListData[i].type == "dir") {
                coursesList.push({
                    subject: notesListData[i].name.replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$1').toUpperCase(),
                    catalog_number: notesListData[i].name.replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$3').toUpperCase()
                })
            }
        }

        getCoursesTitlePromise(coursesList).then(function(data){
            res.render('notes/index', {
                coursesList: data,
                Title: 'Courses',
            })
        }, function(reason){

        })
    }, function(reason){
        res.render('notes/index', {
            error: 'Cannot find notes',
            Title: 'Courses'
        })
    })

})


router.get(/(\w+[0-9]\w*)/, function(req, res){
    console.log('\n--------------------------------')

    getNotesListOfACoursePromise(req.params[0]).then(function(data){
        markdown = md.render(escapeLaTeX(data))
        subject =  req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$1').toUpperCase()
        catalog_number = req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$3').toUpperCase()
        title = subject + ' ' + catalog_number

        function callback(course_title) {

        }

        getCourseTitlePromise(subject, catalog_number).then(function(course_title){
            res.render('notes/detail', {
                markdown: markdown,
                Title: title,
                course_title: course_title
            })
        }, function(reason) {

        })

    }, function(reason){

    })

})


module.exports = router
