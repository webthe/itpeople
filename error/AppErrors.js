class EntityNotFound extends Error{
    constructor(message) {
        super(message)
        this.name = 'EntityNotFound'
        this.message = message
    }
}

class CreateEntityError extends Error{
    
}

class EntityAlreadyExists extends Error{
    
}

class NoDataFound extends Error{
    
}


module.exports = {
    EntityNotFound,
    CreateEntityError,
    EntityAlreadyExists,
    NoDataFound
}