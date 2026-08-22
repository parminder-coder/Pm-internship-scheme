const mongoose = require("mongoose");
const formSchema = new mongoose.Schema({
            userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
},
        personalInfo : {
            name : {
                type : String ,
                required : true ,
                trim : true 
            },
            phone:{
                type: String ,
                required : true ,
                trim: true
            },
            DOB:{
                type : Date,
                required : true 
            },
            gender:{
                type : String , 
                enum: ["Male", "Female"]
            }
        },
        education: {
            degree:{
                type:String,
                required :true 
            },
            field:{
                type:String,
                required : true
            },
            institution:{
                type:String,
                required: true,
            },
            GraduationYear:{
                type: Number,
                required : true
            },
            CGPA:{
                type : Number,
                required: true 
            }
        },
        location:{
            willingToRelocate:{
                type : Boolean
            },
            preferredLocations:{
                type :[String],
                default : []
            }
        },
        preferences:{
            sectors:{
                type :[ String],
                default : []
            },
            preferredRoles:{
                type: [String],
                default : []
            }
        },
        resume:{
            fileUrl:{
                type: String
            },
            parsed:{
                skills:{
                    type : [String],
                    default : []
                },
                education:{
                    type: String,
                    default: ""
                },
                branch:{
                    type: String,
                    default: ""
                },
                experience:{
                    type: String,
                    default: ""
                },
                projects:{
                    type: [String],
                    default: []
                },
                name:{
                    type: String,
                    default: ""
                },
                email:{
                    type: String,
                    default: ""
                },
                phone:{
                    type: String,
                    default: ""
                },
                preferredJobRole:{
                    type: String,
                    default: ""
                },
                preferredDomain:{
                    type: String,
                    default: ""
                },
                matchExplanation:{
                    type: String,
                    default: "You are eligible for this internship because it matches your interest profile and skill development goals."
                },
                warnings:{
                    type: [String],
                    default: []
                },
                bluffWords:{
                    type: [String],
                    default: []
                }
            }
        },
        }, {
    timestamps: true
});

const form = mongoose.model("form", formSchema);
module.exports = form;