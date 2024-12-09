// export default () => Cypress._.random(0, 1e6);
export default () => self.crypto.randomUUID();
