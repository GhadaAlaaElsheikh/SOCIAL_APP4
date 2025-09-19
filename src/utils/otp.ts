
export const generateNumberOtp =():number=>{
  // return Math.floor(Math.random() * (99999 -10000 +1)+10000)
   return Math.floor(100000 + Math.random() * 900000); 

  
}