module.exports = {
    helper:{
        getNonOverlappingCount: async (roomReservations,s,e)=>{
        
            let t1 = new Date(s),
            t2 = new Date(e);
            const start = new Date( t1.getTime() - t1.getTimezoneOffset() * -60000 ),
            end = new Date( t2.getTime() - t2.getTimezoneOffset() * -60000 )
            console.log(start+" "+end);
            let fl = true;
            let count = 1;
            for(let i=await roomReservations.next(); i!=null;i=await roomReservations.next()) {
                let reservation = i.reservationId;
                console.log("here");
                fl=false;
                if((reservation.startDate<start && start < reservation.endDate) || (reservation.startDate<end && end < reservation.endDate)){
                    break;
                }
                count+=1;
            }
            if(!fl){
                return count-1;
            }
            return count;
        },
        getUserCart: async (PlaceCart,userId)=>{
            const placeCart = await PlaceCart.findOne({user:userId}).populate('places.id','-hotels -attractions');
            
            return placeCart;
        }
    },
    middleware:{
        isLoggedIn : (req,res,next)=>{
            if(req.session.passport!==undefined){
                return next();
            }
            res.json({status:400,message:"User must be logged in!!"});
        }
    }
}