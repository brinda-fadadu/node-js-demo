const { returnResult } = require("../helpers/response_return")
const { categoryModel } = require("../models/category.model")

const createCategory = async(country,category)=>{
    try{
        let category_exists = await categoryModel.findOne({country:country,category:category,is_deleted:false})
        if(category_exists){
            return returnResult(success = false, message = "Category already exists.", error = "Category already exists.", data = null)
        }
        let new_category = await categoryModel.create({country:country,categories:category})
        return returnResult(success = true, message = "Category created.", error = "", data = new_category)
    }catch(error){
        console.log("Error from function ( createCategory ) : ", error)
        return returnResult(success = false, message = error.toString(), error = error.toString(), data = null)
    }
}

const getCategories = async()=>{
    try{
        let categories = await categoryModel.find({is_deleted:false})
        if(!categories){
            return returnResult(success = false, message = "No categories found.", error = "No categories found.", data = null)
        }
        return returnResult(success = true, message = "Categories fetched.", error = "", data = categories)
    }catch(error){
        console.log("Error from function ( getCategories ) : ", error)
        return returnResult(success = false, message = error.toString(), error = error.toString(), data = null)
    }
}



const getCategoryByCountry = async(country)=>{
    try{
        let categories = await categoryModel.find({country:country,is_deleted:false})
        if(!categories){
            return returnResult(success = false, message = "No categories found.", error = "No categories found.", data = null)
        }
        return returnResult(success = true, message = "Categories fetched.", error = "", data = categories)
    }catch(error){
        console.log("Error from function ( getCategoryByCountry ) : ", error)
        return returnResult(success = false, message = error.toString(), error = error.toString(), data = null)
    }
}

const updateCategoryById = async(category_id,category)=>{
    try{
        let category_exists = await categoryModel.findOne({_id:category_id,is_deleted:false})
        if(!category_exists){
            return returnResult(success = false, message = "Category not found.", error = "Category not found.", data = null)
        }
        let new_category = await categoryModel.findOneAndUpdate({_id:category_id},{
            categories:category
        },{new:true})
        return returnResult(success = true, message = "Category updated.", error = "", data = new_category)
    }catch(error){
        console.log("Error from function ( updateCategoryById ) : ", error)
        return returnResult(success = false, message = error.toString(), error = error.toString(), data = null)
    }

}

module.exports = {
    createCategory,getCategories,getCategoryByCountry,updateCategoryById
}
