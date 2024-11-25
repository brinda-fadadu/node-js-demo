const mongoose = require('mongoose')
const validator = require('validator')

const fingerPrintSchema = mongoose.Schema({
    finger_print: {
        type: String,
        required: [true, 'Finger Print is required.'],
    },
    email : {
        type: String,
    },
    customer_id:{
        type: String,
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const fingerPrintModel = mongoose.model('Fingerprint', fingerPrintSchema)

module.exports = {
    fingerPrintModel
}
