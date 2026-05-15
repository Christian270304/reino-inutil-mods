StartupEvents.registry('block', event => {
  event.create('atm')
    .displayName('ATM')
    .notSolid()
    .unbreakable()
    .noDrops()
    .box(2, 0, 2, 14, 16, 14)
})