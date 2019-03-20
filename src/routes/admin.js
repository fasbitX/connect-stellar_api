import { Admin } from '../models/AdminSchema'; 
import { createAccount } from '../service/stellarAccount';

export const createUser = (req, res) => {
    const admin = new Admin(req.body);
    admin.save(async (error, response) => {
        if(error) console.error(error);
        else {
            res.send(response);
        }
    })
}

export const loginUser = (req, res) => {

    Admin.findOne(
        {mobile_number: req.body.mobile_number}, 
        (error, user) => {
            if(error) console.error(error);
            else {
                user.comparePassword(req.body.password, (error, isMatch) => {
                    if(error) console.error(error);
                    else {
                        isMatch ? res.status(200).send(user) : res.send('Incorrect password');
                    }
                });
            }
        }
    )
}

export const updateUser = (id, body, res) => {

    Admin.findOneAndUpdate(
        {_id: id}, 
        {$set: body}, 
        {new: true, upsert: true}, 
        (error, response) => {
            if(error) console.error(error);
            else {
                res.status(200).send(response);
            }
        }
    )
}

export const updateProfile = (req, res) => {
    updateUser(req.params.id, req.body, res)
}   

export const getAdmin = () => {
    return Admin.findOne((error, response) => {
        if(error) console.error(error);
        else {
            return(response);
        } 
    })
}

export const adminDetails = async (req, res) => {
    const response = await getAdmin();
    res.status(200).send(response);
}

export const createStellarAddress = async (req, res) => {
    const admin = await getAdmin();
    const stellarAccount = await createAccount();
    console.log('stellarAccount', stellarAccount);
    updateUser(admin._id, stellarAccount, res);
}



