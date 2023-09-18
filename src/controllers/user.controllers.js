const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const EmailCode = require('../models/EmailCode');
const sendEmail = require('../utils/sendemail');
const jwt = require('jsonwebtoken')

const getAll = catchError(async(req, res) => {
    const results = await User.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    const{ firstName, lastName, email, password, country, image,frontBaseUrl} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        country,
        image,
    });
    const code = require('crypto').randomBytes(32).toString('hex'); //crea un codigo de 32 caracteres por usuario 
    const link = `${frontBaseUrl}/auth/verify_email/${code}`;  //genera un link 
    await EmailCode.create({code,userId:result.id});
    await sendEmail({
        to:email,
        subject:'verify_email',
        html:`<h1>Welcome to the app, ${firstName}</h1>
        <p>Thanks for registering, please verify your email by clicking on the link below</p>
        <a href="${link}">${link}</a>`
    })
    return res.status(201).json(result);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

//verificacion de email
const verifyEmail = catchError(async(req, res) => {
    const {code}= req.params
    const emailCode = await EmailCode.findOne({where:{code}})
    if(!emailCode)return res.status(404).json({message:'code not found'})
    const user = await User.findByPk(emailCode.userId)
    if(!user)return res.status(404).json({message:'user not found'})
    user.isVerified = true
    await user.save()
    await emailCode.destroy()
    return res.json(user)
});



const login = catchError(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({mensaje: "Credenciales invalidas"})
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) return res.status(404).json({mensaje: "Credenciales invalidas"})
    const isVerified = user.isVerified;
    if (!isVerified) return res.status(404).json({mensaje: "El usuario no esta verificado"})
    const token = jwt.sign({user}, process.env.TOKEN_SECRET, {expiresIn: "1d"})
    return res.json({user, token})
});

const getLoggedUser = catchError(async (req, res) => {
    const { user } = req;
    return res.json(user);
});




module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyEmail,
    login,
    getLoggedUser
}