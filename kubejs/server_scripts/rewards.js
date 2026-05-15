EntityEvents.death(event => {

    const entity = event.entity
    const source = event.source.player

    if (!source) return

    if (entity.type == "minecraft:zombie") {

        source.server.runCommandSilent(
            `/eco give ${source.username} 5`
        )
    }
})