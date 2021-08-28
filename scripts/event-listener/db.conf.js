const config = {
    db: {
        HOST: 'localhost',
        USER: 'paul',
        PASSWORD: '',
        DB: 'Punks',
        dialect: 'sqlite',
        pool: {
            max: 15,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        storage: './punks.sqlite'
    },
    net: {
        timeDelta: 20
    }
}

module.exports = {
    config
}