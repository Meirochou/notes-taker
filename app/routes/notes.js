var express = require('express'),
app = express(),
router = express.Router(),
https = require('https'),
md = require('markdown-it')({html: true}),
url = require('url'),
owner = 'zhongweizhao',
repo = 'github-api-test',
uwAPIKey = '5edb44d933a5d6262bc77b8375ae0a3d'

function getNotesList(callback){
    var options = {
        host: 'api.github.com',
        path: '/repos/' + owner + '/' + repo + '/contents/',
        method: 'GET',
        headers: {'user-agent': 'node.js'}
    }

    var body = ''
    var request = https.request(options, function(response){
        console.log('statusCode:', response.statusCode)
        console.log('' + response.headers['content-type'])

        response.on('data', function(d){
            body += d.toString('utf8')
        })

        response.on('end', function(){
            console.log('Close reveived!\n')
            callback(body)
        })
    })

    request.on('error', function(e){
        console.log('problem with request: ' + e.message)
    })

    request.end()
}


function getNoteOfACourse(courseCode, callback) {

    function downloadNotes(noteFilesList, callback, md) {

        if (md === undefined) {
            md = ""
        }

        if (noteFilesList.length == 0){
            console.log('|Finished downloading all notes.\n')
            callback(md)
        } else {
            /* get the first note and */
            var options = {
                host: 'raw.githubusercontent.com',
                path: url.parse(noteFilesList[0].download_url).pathname,
                method: 'GET',
                headers: {'user-agent': 'node.js'}
            }

            console.log('|\tDownloading from ' + options.path)

            var request = https.request(options, function(response){
                console.log('|\tstatusCode:', response.statusCode)
                console.log('|\t' + response.headers['content-type'])

                response.on('data', function(d){
                    md += d.toString('utf8')
                })

                response.on('end', function(){
                    console.log('|\tReveived!')
                    md += '\n'
                    /* get the rest notes */
                    downloadNotes(noteFilesList.slice(1), callback, md)
                })
            })

            request.on('error', function(e){
                console.log('problem with request: ' + e.message)
            })

            request.end()


        }
    }


    var options = {
        host: 'api.github.com',
        path: '/repos/' + owner + '/' + repo + '/contents/' + courseCode,
        method: 'GET',
        headers: {'user-agent': 'node.js'}
    }

    var body = ''
    var request = https.request(options, function(response){
        console.log('statusCode:', response.statusCode)
        console.log(response.headers['content-type'])

        response.on('data', function(d){
            body += d.toString('utf8')
        })

        response.on('end', function(){
            console.log('Close reveived!\n')
            noteFilesList = JSON.parse(body)
            if (response.statusCode == 200){
                console.log('|Start download notes.\n')
                downloadNotes(noteFilesList, callback)
            } else {
                var console_message = 'Fail to find notes\n'
                console.log(console_message)
                var message = '`Fail to fetch notes`'
                callback(message)
            }
        })
    })

    request.on('error', function(e){
        console.log('problem with request: ' + e.message)
    })

    request.end()

}



function getCourseTitle(subject, catalog_number, callback) {
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
                    callback(Title)
                } else {
                    console.log('|\tCourse title failed to get')
                    callback('Failed to get course title')
                }
            } else {
                console.log('|\tRequest failed')
            }
        })
    })

    request.on('error', function(e){
        console.log('problem with request: ' + e.message)
    })

    request.end()
}

/* get title of an array of courses */
/*
params:
coursesList = [
{
subject: "CS",
catalog_number: "145"
},
{
subject: "MATH",
catalog_number: "135"
}
],
callback

will exec

var newCoursesList = [
{
subject: "CS",
catalog_number: "145",
title: "Designing Functional Programs (Advanced Level)"
},
{
subject: "MATH",
catalog_number: "135",
title: "Algebra for Honours Mathematics"
}
],
callback(newCoursesList)

*/
function getCoursesTitle(coursesList, callback) {
    function getCoursesTitleHelper(coursesList, callback, newCoursesList) {
        if (coursesList.length == 0) {
            callback(newCoursesList)
        } else {
            getCourseTitle(coursesList[0].subject, coursesList[0].catalog_number, function(title){
                coursesList[0].title = title
                newCoursesList.push(coursesList[0])
                getCoursesTitleHelper(coursesList.slice(1), callback, newCoursesList)
            })
        }
    }

    getCoursesTitleHelper(coursesList, callback, [])
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
    function callback(notesListData) {
        var info = ''
        notesListData = JSON.parse(notesListData)

        var coursesList = []

        for (i = 0; i < notesListData.length; i++) {
            if (notesListData[i].type == "dir") {
                coursesList.push({
                    subject: notesListData[i].name.replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$1').toUpperCase(),
                    catalog_number: notesListData[i].name.replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$3').toUpperCase()
                })
            }
        }

        /* the above code will generate a coursesList like the following:

        coursesList = [
        {
        subject: "CS",
        catalog_number: "145"
    },
    {
    subject: "MATH",
    catalog_number: "135"
}
]

*/

function callback(coursesList) {
    res.render('notes/index', {
        coursesList: coursesList,
        Title: 'Courses'
    })
}

getCoursesTitle(coursesList, callback)

}

getNotesList(callback)

})

router.get(/(\w+[0-9]\w*)/, function(req, res){
    console.log('\n--------------------------------')
    function callback(data) {
        markdown = md.render(escapeLaTeX(data))
        subject =  req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$1').toUpperCase()
        catalog_number = req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$3').toUpperCase()
        title = subject + ' ' + catalog_number

        function callback(course_title) {
            res.render('notes/detail', {
                markdown: markdown,
                Title: title,
                course_title: course_title
            })
        }

        getCourseTitle(subject, catalog_number, callback)

    }

    getNoteOfACourse(req.params[0], callback)
})

module.exports = router
