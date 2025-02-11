const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../server"); // Adjust the path as necessary
const should = chai.should();

chai.use(chaiHttp);

describe("Bulge Check API", () => {
  it("should return the defect status on POST", (done) => {
    chai.request(server)
      .post("/check-bulge")
      .send({sensorData: "left"})
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('status').eql('success');
        res.body.should.have.property('defect').eql('lb');
        done();
      });
  });
}); 