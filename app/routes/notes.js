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

router.get(/(\w+[0-9]\w*)/, function(req, res){
	console.log('\n--------------------------------')
    const getContentPromise = new Promise(
        (resolve, reject)=>{
            let options = {
                host: 'api.github.com',
                path: '/repos/' + owner + '/' + repo + '/contents/' + req.params[0],
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
                    console.log("bryan's testing")
                    console.log('Close reveived!\n')
                    let noteFilesList = JSON.parse(body)
                    if (response.statusCode == 200){
                        console.log('|Start download notes.\n');
                        resolve(noteFilesList);
                        //downloadNotes(noteFilesList, callback)
                    } else {
                        var console_message = 'Fail to find notes\n'
                        console.log(console_message)
                        var message = '`Fail to fetch notes`'
                        reject(new Error(message));
                    }
                })
            })

            request.on('error', function(e){
                reject(new Error('problem with request: ' + e.message));
                //console.log('problem with request: ' + e.message)
            })

            request.end()
        }
    )

    getContentPromise
        .then(
            (noteFilesList)=>{
                let bmd = '';
                new Promise((resolve, reject)=>{
                    for(let i=0; i<noteFilesList.length; i++){
                        let options = {
                            host: 'raw.githubusercontent.com',
                            path: url.parse(noteFilesList[i].download_url).pathname,
                            method: 'GET',
                            headers: {'user-agent': 'node.js'}
                        }
                        console.log('|\tDownloading from ' + options.path)
                        var request = https.request(options, function(response){
                            console.log('|\tstatusCode:', response.statusCode)
                            console.log('|\t' + response.headers['content-type'])

                            response.on('data', function(d){
                                bmd += d.toString('utf8')
                            })

                            response.on('end', function(){
                                console.log('|\tReceived!');
                                //console.log(bmd);
                                if(i===(noteFilesList.length-1)) resolve(bmd);
                                //console.log(bmd);
                                //downloadNotes(noteFilesList.slice(1), callback, md)
                            })
                        })

                        request.on('error', function(e){
                            reject(new Error('problem with request: ' + e.message));
                        })
                        request.end();
                    }
                })
                    .then((bmd)=>{
                        markdown = md.render(escapeLaTeX(bmd))
                        subject =  req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$1').toUpperCase()
                        catalog_number = req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$3').toUpperCase()
                        title = subject + ' ' + catalog_number

                        let options = {
                            host: 'api.uwaterloo.ca',
                            path: '/v2/courses/' + subject + '/' + catalog_number + '.json?key=' + uwAPIKey,
                            method: 'GET',
                            headers: {'user-agent': 'node.js'}
                        }

                        var body = '', course_title = '';
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
                                        course_title = data.data.title
                                        console.log(course_title);
                                        res.render('notes/detail', {
                                            markdown: markdown,
                                            Title: title,
                                            course_title: course_title
                                        })
                                    } else {
                                        console.log('|\tCourse title failed to get')
                                        course_title = 'Failed to get course title';
                                    }
                                } else {
                                    console.log('|\tRequest failed')
                                }
                            })
                        })

                        request.on('error', function(e){
                            console.log('problem with request: ' + e.message)
                        })

                        request.end();
                    })
                    .catch(error=>{
                        console.log(error.message);
                    });
            }
        )
        .catch(error => console.log(error.message));
})

module.exports = router
