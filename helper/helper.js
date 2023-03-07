module.exports = {
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
            fl=false;
            if((reservation.startDate<start && start < reservation.endDate) || (reservation.startDate<end && end < reservation.endDate)){
                break;
            }
            count+=1;
        }
        if(fl){
            return count-1;
        }
        return count;
    }
}