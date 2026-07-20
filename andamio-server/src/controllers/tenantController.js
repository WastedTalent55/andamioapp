const Tenant = require('../models/tenantModel')

exports.updateTenantConfig = async(req,res)=>{
    try{

        const tenantId = req.user.tenantId;


        await Tenant.update(
            tenantId,
            req.body
        );


        res.json({
            success:true,
            message:"Infraestructura de empresa actualizada con éxito"
        });


    }catch(err){

        res.status(500).json({
            success:false,
            error:err
        });

    }

};

exports.getTenantConfig = async(req,res)=>{

    try{

        const tenantId = req.user.tenantId;


        const results = await Tenant.getById(tenantId);


        res.json({
            success:true,
            data:results
        });


    }catch(err){

        res.status(500).json({
            success:false,
            error:err
        });

    }

};