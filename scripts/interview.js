let WebClient = require("@slack/client").WebClient
let _ = require("lodash");

let current_question = 0;
let current_user = null;



let user_list = ['aqudei'];
let answers = [];

let questions = [
    'please give me a number between 1-10 (add A after number to be anonymous example: 2A)',
    'Any comments?',
    'please fill out this survey for: https://www.peteranswers.com/',
]


unameToId = (web, username, cb) => {
    web.users.list().then((response) => {
        user = response.members.find((user) => user.name === username);
        userId = user.id;
        cb(userId);
    }).catch((error) => {
        console.error(error);
        cb(null);
    });
};

module.exports = (robot) => {

    let web = new WebClient(robot.adapter.options.token);

    robot.hear(/list channels/i, (res) => {
        web.users.list().then((response) => {
            console.log(response);
        }).catch((error) => {
            console.error(error);
        });
    });


    robot.hear(/test/i, (res) => {
        web.api.test().then(() => {
            res.send("Your connection to the Slack API is working!");
        }).catch(() => {
            res.send("Your connection to the Slack API failed :(");
        });
    });

    robot.hear(/start interview/, res => {

        index = 0;
        //aqudei_only = res.envelope.user.id
        //robot.messageRoom(, 'personal eto');
        res.send('Ok i will...');
        user_list.forEach(element => {
            unameToId(web, element, id => {
                if (id) {

                    qa = {
                        userId: id,
                        userName: element,
                        questionId: 0,
                        questionBody: questions[0],
                        answer: ''
                    };

                    answers.push(qa);

                    robot.messageRoom(qa.userId, qa.questionBody);

                } else {
                    console.log('Skipping user: <' + element + '>. No such slack user found');
                }
            });
        });
    });

    robot.hear(/.*/, res => {

        qa = _.findLast(answers, a => a.userId === res.message.user.id);
        
        console.log('Existing');
        console.log(qa);
        
        if (qa) {
            qa.answer = res.message.text;
            newQa = {
                userId: qa.userId,
                userName: qa.userName,
                questionId: qa.questionId + 1,
                questionBody: questions[qa.questionId + 1],
                answer: ''
            };

            console.log('New Q');
            console.log(newQa);
            
            answers.push(newQa);
            res.reply(newQa.questionBody);
        }
    });

};