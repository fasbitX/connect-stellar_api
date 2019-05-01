import { Admin } from '../models/AdminSchema'; 
import { createAccount } from '../service/stellarAccount';

export const createUser = (req, res) => {
    if (req.body.mobile_number == null || new String(req.body.mobile_number).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing mobile number' });
        return;
    }
    if (req.body.code == null || new String(req.body.code).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing code' });
        return;
    }
    if (req.body.password == null || new String(req.body.password).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing password' });
        return;
    }
    const admin = new Admin(req.body);
    admin.save(async (error, response) => {
        if(error) console.error(error);
        else {
            res.send(response);
        }
    })
}

// export const createAdmin = (req, res) => {
//     new Admin({
//         mobile_number: 1234567890,
//         password: '00000',
//     }).save().then((response) => {
//         res.send(response);
//     });
// }


export const loginUser = (req, res) => {
    if (req.body.mobile_number == null || new String(req.body.mobile_number).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing mobile number' });
        return;
    }
    if (req.body.password == null || new String(req.body.password).length <= 1) {
        res.status(500).send({ 'message': 'OOPS!! missing password' });
        return;
    }
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
    try{
        const response = await getAdmin();
        res.status(200).send(response);
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    } 
}

export const createStellarAddress = async (req, res) => {
    //const admin = await getAdmin();
    try {
        const stellarAccount = await createAccount();
        console.log('stellarAccount', stellarAccount);
    } catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    } 
    try {
        new Admin({
            mobile_number: 1234567890,
            password: '00000',
            stellarAddress: stellarAccount.stellarAddress,
            stellarSeed: stellarAccount.stellarSeed,
            stripeKey: process.env.STRIPE_KEY
        }).save().then((response) => {
            res.send(response);
        });
    }
    catch (error) {
        res.status(500).send({ 'message': 'OOPS!! Something went wrong' });
        return;
    } 

    //updateUser(admin._id, stellarAccount, res);
}



