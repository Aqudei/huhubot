var WebClient = require("@slack/client").WebClient;
var HubotCron = require("hubot-cronjob");
var Request = require("request");
var _ = require("lodash");

let questions = [
    'please give me a number between 1-10 (add A after number to be anonymous example: 2A)',
    'Any comments?',
    'please fill out this survey for: https://www.peteranswers.com/',
]

// Run every  minute (for testing)
const pattern = '* * * * *';

// run daily at 12 noon
//const pattern = '0 12 * * *';

const timezone = 'Europe/Prague';

module.exports = (robot) => {
    // USER LIST
    // aqudei will be interviewed
    let user_list = ['aqudei'];

    let answers = [];

    let web = new WebClient(robot.adapter.options.token);

    let unameToId = (username, cb) => {
        web.users.list().then((response) => {
            user = response.members.find((user) => user.name === username);
            userId = user.id;
            cb(userId);
        }).catch((error) => {
            console.error(error);
            cb(null);
        });
    };

    let startInterview = () => {
        // Fetch user names like this

        // fetch('https://getusernameslist.com/users').then((response) => {
        //     user_list = response.users;


        // }).catch(error => {
        //     console.error(error);
        // });

        index = 0;
        answers = [];

        user_list.forEach(element => {
            unameToId(element, id => {
                if (id) {

                    qa = {
                        userId: id,
                        userName: element,
                        questionId: 0,
                        questionBody: questions[0],
                        answer: null
                    };

                    answers.push(qa);

                    robot.messageRoom(qa.userId, qa.questionBody);

                } else {
                    console.log('Skipping user: <' + element + '>. No such slack user found');
                }
            });
        });
    };

    robot.hear(/test/i, (res) => {
        web.api.test().then(() => {
            res.send("Your connection to the Slack API is working!");
        }).catch(() => {
            res.send("Your connection to the Slack API failed :(");
        });
    });

    robot.hear(/.*/, res => {

        qa = _.findLast(answers, a => a.userId === res.message.user.id);

        if (!qa) {
            res.reply('No question was asked yet.');
            return;
        }

        if (qa.answer) {
            res.reply('All question for you were already answered.');
            return;
        }

        qa.answer = res.message.text;

        if (qa.questionId == 0) {
            if (res.message.text.endsWith('A')) {
                res.reply('Your answers will be anonymous.');
            }
        }

        // qa here will contain the recently answered question of the user,
        // it will have property userId, userName, questionId, questionBody, answer
        // This is the one that will be push to the server

        // rqst({
        //     url: 'https://post.endpoint.com',
        //     method: 'POST',
        //     json: { qa: qa }
        // }, (err, resp, body) => {

        // });

        

        newQa = {
            userId: qa.userId,
            userName: qa.userName,
            questionId: qa.questionId + 1,
            questionBody: questions[qa.questionId + 1],
            answer: ''
        };

        answers.push(newQa);

        if (newQa.questionId === questions.length - 1) {
            qa_first = _.find(answers, a => a.userId === res.message.user.id);
            if (qa_first) {
                if (qa_first.answer.endsWith('A')) {
                    res.reply("You've specified A meaning your responses will be submitted anonymously.");
                }
            }
        }

        res.reply(newQa.questionBody);

    });

    new HubotCron(pattern, timezone, startInterview);
};