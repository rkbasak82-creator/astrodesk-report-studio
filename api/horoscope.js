const calculate = require('./calculate');
module.exports = async function handler(req,res){
  if(req.method==='POST' && req.body && !req.body.system){
    req.body={...req.body,system:'vedic',options:['birthDetails','planetPositions','dasha'],charts:['rasi','navamsa']};
  }
  return calculate(req,res);
};
