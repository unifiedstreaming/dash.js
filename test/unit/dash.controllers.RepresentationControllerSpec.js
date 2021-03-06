import ObjectsHelper from './helpers/ObjectsHelper';
import VoHelper from './helpers/VOHelper';
import MpdHelper from './helpers/MPDHelper';
import EventBus from '../../src/core/EventBus';
import RepresentationController from '../../src/dash/controllers/RepresentationController';
import MediaController from '../../src/streaming/controllers/MediaController';
import ManifestModel from '../../src/streaming/models/ManifestModel';
import Events from '../../src/core/events/Events';
import MediaPlayerEvents from '../../src/streaming/MediaPlayerEvents';
import DashManifestModel from '../../src/dash/models/DashManifestModel';
import TimelineConverter from '../../src/dash/utils/TimelineConverter';
import SpecHelper from './helpers/SpecHelper';

import AbrControllerMock from './mocks/AbrControllerMock';
import DomStorageMock from './mocks/DomStorageMock';

const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

const expect = chai.expect;
const voHelper = new VoHelper();
const objectsHelper = new ObjectsHelper();

describe('RepresentationController', function () {
    // Arrange
    const context = {};
    const testType = 'video';
    const specHelper = new SpecHelper();
    const mpdHelper = new MpdHelper();
    const mpd = mpdHelper.getMpd('static');
    const data = mpd.Period_asArray[0].AdaptationSet_asArray[0];
    const adaptation = voHelper.getDummyRepresentation(testType).adaptation;
    const streamProcessor = objectsHelper.getDummyStreamProcessor(testType);
    const eventBus = EventBus(context).getInstance();
    const manifestModel = ManifestModel(context).getInstance();
    const mediaController = MediaController(context).getInstance();
    const timelineConverter = TimelineConverter(context).getInstance();
    const dashManifestModel = DashManifestModel(context).getInstance({
        mediaController: mediaController,
        timelineConverter: timelineConverter
    });

    Events.extend(MediaPlayerEvents);

    manifestModel.setValue(mpd);

    const abrControllerMock = new AbrControllerMock();
    const domStorageMock = new DomStorageMock();

    abrControllerMock.registerStreamType();

    const representationController = RepresentationController(context).create();
    representationController.setConfig({
        abrController: abrControllerMock,
        domStorage: domStorageMock,
        dashManifestModel: dashManifestModel,
        manifestModel: manifestModel,
        streamProcessor: streamProcessor
    });
    representationController.initialize();

    it('should not contain data before it is set', function () {
        // Act
        const data = representationController.getData();

        // Assert
        expect(data).not.exist; // jshint ignore:line
    });

    describe('when data update started', function () {
        let spy;

        beforeEach(function () {
            spy = chai.spy();
            eventBus.on(Events.DATA_UPDATE_STARTED, spy);
        });

        afterEach(function () {
            eventBus.off(Events.DATA_UPDATE_STARTED, spy);
        });

        it('should fire dataUpdateStarted event when new data is set', function () {
            // Act
            representationController.updateData(data, adaptation, testType);

            // Assert
            expect(spy).to.have.been.called.exactly(1);
        });
    });

    describe('when data update completed', function () {
        beforeEach(function (done) {
            representationController.updateData(data, adaptation, testType);
            setTimeout(function () {
                done();
            }, specHelper.getExecutionDelay());
        });

        it('should return the data that was set', function () {
            expect(representationController.getData()).to.equal(data);
        });

        it('should return correct data index', function () {
            const expectedValue = 0;

            expect(representationController.getDataIndex()).to.equal(expectedValue);
        });

        it('should return correct representation for quality', function () {
            const quality = 0;
            const expectedValue = 0;

            expect(representationController.getRepresentationForQuality(quality).index).to.equal(expectedValue);
        });

        it('should return null if quality is undefined', function () {
            expect(representationController.getRepresentationForQuality()).to.equal(null);
        });

        it('should return null if quality is greater than voAvailableRepresentations.length - 1', function () {
            expect(representationController.getRepresentationForQuality(150)).to.equal(null);
        });
    });

    describe('when a call to reset is done', function () {
        it('should not contain data after a call to reset', function () {
            representationController.reset();
            // Act
            const data = representationController.getData();

            // Assert
            expect(data).not.exist; // jshint ignore:line
        });
    });
});
