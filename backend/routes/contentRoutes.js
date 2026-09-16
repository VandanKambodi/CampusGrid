const express = require('express');
const router = express.Router();
const {
    getPolls,
    getPollById,
    createPoll,
    updatePoll,
    deletePoll,
    publishPoll,
    archivePoll,
    voteOnPoll,
    getSurveys,
    getSurveyById,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    publishSurvey,
    archiveSurvey,
    submitSurvey,
    getSurveyResults,
    getFeedbacks,
    getFeedbackById,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    publishFeedback,
    archiveFeedback,
    getPollResults,
    getAdminPolls,
    getAdminSurveys,
    getAdminFeedback
} = require('../controllers/contentController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/polls', protect, getPolls);
router.get('/polls/:id', protect, getPollById);
router.post('/polls/:id/vote', protect, voteOnPoll);
router.get('/polls/:id/results', protect, getPollResults);

router.get('/surveys', protect, getSurveys);
router.get('/surveys/:id', protect, getSurveyById);
router.post('/surveys/:id/submit', protect, submitSurvey);
router.get('/surveys/:id/results', protect, admin, getSurveyResults);

router.get('/feedback', protect, getFeedbacks);
router.get('/feedback/:id', protect, getFeedbackById);

router.get('/admin/polls', protect, admin, getAdminPolls);
router.post('/admin/polls', protect, admin, createPoll);
router.put('/admin/polls/:id', protect, admin, updatePoll);
router.delete('/admin/polls/:id', protect, admin, deletePoll);
router.patch('/admin/polls/:id/publish', protect, admin, publishPoll);
router.patch('/admin/polls/:id/archive', protect, admin, archivePoll);

router.get('/admin/surveys', protect, admin, getAdminSurveys);
router.post('/admin/surveys', protect, admin, createSurvey);
router.put('/admin/surveys/:id', protect, admin, updateSurvey);
router.delete('/admin/surveys/:id', protect, admin, deleteSurvey);
router.patch('/admin/surveys/:id/publish', protect, admin, publishSurvey);
router.patch('/admin/surveys/:id/archive', protect, admin, archiveSurvey);

router.get('/admin/feedback', protect, admin, getAdminFeedback);
router.post('/admin/feedback', protect, admin, createFeedback);
router.put('/admin/feedback/:id', protect, admin, updateFeedback);
router.delete('/admin/feedback/:id', protect, admin, deleteFeedback);
router.patch('/admin/feedback/:id/publish', protect, admin, publishFeedback);
router.patch('/admin/feedback/:id/archive', protect, admin, archiveFeedback);

module.exports = router;
