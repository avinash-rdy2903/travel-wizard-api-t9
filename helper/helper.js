module.exports = {
    getNongetNonOverlappingCount: (roomReservations,start,end)=>{
        let reservations = roomReservations.reservations
        let start = new Date(start),
            end = new Date(end);
        let count = 0;
        for(let reservation in reservations){
            if((reservation.startDate<start && start < reservation.endDate) || (reservation.startDate<end && end < reservation.endDate)){
                return 0;
            }
        }
        return 1;
    }
}