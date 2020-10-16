const crypto = require('crypto');
const db = require('./firebase');
const settings = require('./settings');

exports.handleNewMergedPullRequest = (req, res) => {
    if (req.body.action === 'closed' && req.body.pull_request.merged === true) {
        return validatePullRequest(req)
            .then(() => {
                console.log('user validated, about to save');
                saveToDatabase(req.body.pull_request.user.login);
            }).then(() => {
                res.status(200).end();
            })
            .catch((err) => {
                console.error(err.stack);
                res.status(err.statusCode ? err.statusCode : 500)
                    .send(err.message)
                    .end();
            });
    } else {
        res.end();
        return;
    }
};

function saveToDatabase(githubId) {
    return db.collection('users').doc(githubId.toLowerCase()).update({
        verified: true
    }).then(() => {
        console.log('saved')
    }).catch(error => {
        console.error(error)
    });
}

function validatePullRequest(req) {
    return Promise.resolve()
        .then(() => {
            const digest = crypto
                .createHmac('sha1', settings.secretToken)
                .update(JSON.stringify(req.body))
                .digest('hex');
            if (req.headers['x-hub-signature'] !== `sha1=${digest}`) {
                const error = new Error('Unauthorized');
                error.statusCode = 403;
                throw error;
            } else {
                console.log('Request validated.');

            }
        });
}
